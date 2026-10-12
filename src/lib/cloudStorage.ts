import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import type { UserProfile, ConversionRecord, StoredFile } from '../types';
import { saveLocalBlob, getLocalBlob, deleteLocalBlob } from './indexedDb';

const LOCAL_CONVERSIONS_KEY = 'documorph_local_conversions_';
const LOCAL_FILES_META_KEY = 'documorph_local_files_meta_';
const LOCAL_PROFILE_KEY = 'documorph_local_profile_';

/**
 * Creates or updates user profile upon authentication
 */
export async function syncUserProfile(user: { uid: string; email: string | null; displayName: string | null }): Promise<UserProfile> {
  const now = new Date().toISOString();

  // If not signed in to Firebase Auth or is local user, store in localStorage
  if (!auth.currentUser || auth.currentUser.uid !== user.uid) {
    const key = `${LOCAL_PROFILE_KEY}${user.uid}`;
    const raw = localStorage.getItem(key);
    let profile: UserProfile;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        profile = {
          ...parsed,
          updatedAt: now,
          displayName: user.displayName || parsed.displayName || 'DocuMorph User',
          email: user.email || parsed.email,
        };
      } catch {
        profile = {
          userId: user.uid,
          email: user.email || `${user.uid}@documorph.local`,
          displayName: user.displayName || 'DocuMorph User',
          totalConversions: 0,
          storageUsedBytes: 0,
          createdAt: now,
          updatedAt: now,
        };
      }
    } else {
      profile = {
        userId: user.uid,
        email: user.email || `${user.uid}@documorph.local`,
        displayName: user.displayName || 'DocuMorph User',
        totalConversions: 0,
        storageUsedBytes: 0,
        createdAt: now,
        updatedAt: now,
      };
    }
    localStorage.setItem(key, JSON.stringify(profile));
    return profile;
  }

  // Firebase Firestore syncing
  const userRef = doc(db, 'users', user.uid);
  try {
    const existingSnap = await getDoc(userRef);
    if (existingSnap.exists()) {
      const data = existingSnap.data() as UserProfile;
      const updated: UserProfile = {
        ...data,
        updatedAt: now,
        displayName: user.displayName || data.displayName || 'DocuMorph User',
        email: user.email || data.email,
      };
      await setDoc(userRef, updated, { merge: true });
      return updated;
    } else {
      const newProfile: UserProfile = {
        userId: user.uid,
        email: user.email || `${user.uid}@documorph.local`,
        displayName: user.displayName || 'DocuMorph User',
        totalConversions: 0,
        storageUsedBytes: 0,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(userRef, newProfile);
      return newProfile;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}

/**
 * Saves a conversion record strictly under user's private history
 */
export async function saveConversionRecord(
  userId: string,
  record: Omit<ConversionRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<ConversionRecord> {
  const conversionId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const fullRecord: ConversionRecord = {
    ...record,
    id: conversionId,
    userId,
    createdAt: now,
    updatedAt: now,
  };

  // Local storage backup & offline / guest handler
  try {
    const key = `${LOCAL_CONVERSIONS_KEY}${userId}`;
    const raw = localStorage.getItem(key);
    const existing: ConversionRecord[] = raw ? JSON.parse(raw) : [];
    existing.unshift(fullRecord);
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 100)));
  } catch {
    // ignore local storage errors
  }

  // If user is Firebase authenticated, sync with Firestore
  if (auth.currentUser && auth.currentUser.uid === userId) {
    const conversionRef = doc(db, 'users', userId, 'conversions', conversionId);
    try {
      await setDoc(conversionRef, fullRecord);

      // Update user profile aggregate count
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const curData = userSnap.data() as UserProfile;
        await setDoc(
          userRef,
          {
            totalConversions: (curData.totalConversions || 0) + 1,
            storageUsedBytes: (curData.storageUsedBytes || 0) + (record.totalResultSizeBytes || 0),
            updatedAt: now,
          },
          { merge: true }
        );
      }
    } catch (error) {
      console.warn('Firestore sync warning:', error);
    }
  }

  return fullRecord;
}

/**
 * Saves a converted file to secure cloud/personal vault for the user
 */
export async function saveConvertedFileToVault(
  userId: string,
  conversionRecordId: string,
  fileName: string,
  fileType: string,
  blob: Blob,
  thumbnailUrl?: string
): Promise<StoredFile> {
  const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  // Store binary in local IndexedDB tied to userId
  await saveLocalBlob(fileId, userId, blob, fileName);

  let safeThumb = thumbnailUrl;
  if (safeThumb && safeThumb.length > 200000) {
    safeThumb = undefined;
  }

  const storedFile: StoredFile = {
    id: fileId,
    userId,
    conversionRecordId,
    fileName,
    fileType,
    sizeBytes: blob.size,
    thumbnailUrl: safeThumb,
    createdAt: now,
    updatedAt: now,
  };

  // Always keep file metadata in local metadata index
  try {
    const key = `${LOCAL_FILES_META_KEY}${userId}`;
    const raw = localStorage.getItem(key);
    const existing: StoredFile[] = raw ? JSON.parse(raw) : [];
    existing.unshift(storedFile);
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 150)));
  } catch {
    // ignore
  }

  // If user is Firebase authenticated, also sync metadata to Firestore
  if (auth.currentUser && auth.currentUser.uid === userId) {
    const fileRef = doc(db, 'users', userId, 'files', fileId);
    try {
      let fileData: string | undefined = undefined;
      if (blob.size < 600 * 1024) {
        try {
          fileData = await blobToDataUrl(blob);
        } catch {
          // ignore
        }
      }
      if (fileData) {
        storedFile.fileData = fileData;
      }
      await setDoc(fileRef, storedFile);
    } catch (error) {
      console.warn('Firestore file metadata sync warning:', error);
    }
  }

  return storedFile;
}

/**
 * Loads conversion history for the current user ID
 */
export async function getUserConversions(userId: string): Promise<ConversionRecord[]> {
  // Try Firestore if signed in
  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      const convColl = collection(db, 'users', userId, 'conversions');
      const q = query(convColl, orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((docSnap) => docSnap.data() as ConversionRecord);
      }
    } catch (error) {
      console.warn('Error fetching conversions from Firestore, falling back to local vault:', error);
    }
  }

  // Fallback to local storage
  try {
    const key = `${LOCAL_CONVERSIONS_KEY}${userId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Loads stored files for the current user ID
 */
export async function getUserStoredFiles(userId: string): Promise<StoredFile[]> {
  // Try Firestore if signed in
  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      const filesColl = collection(db, 'users', userId, 'files');
      const q = query(filesColl, orderBy('createdAt', 'desc'), limit(100));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((docSnap) => docSnap.data() as StoredFile);
      }
    } catch (error) {
      console.warn('Error fetching files from Firestore, falling back to local vault:', error);
    }
  }

  // Fallback to local storage
  try {
    const key = `${LOCAL_FILES_META_KEY}${userId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Retrieves file blob for downloading (from Firestore fileData or IndexedDB)
 */
export async function retrieveFileBlob(file: StoredFile): Promise<Blob> {
  // Check IndexedDB first
  const local = await getLocalBlob(file.id);
  if (local) return local;

  // Check fileData
  if (file.fileData) {
    return dataUrlToBlob(file.fileData);
  }

  throw new Error('File payload unavailable in local session cache. Please re-convert if needed.');
}

/**
 * Securely deletes a stored file
 */
export async function deleteUserFile(userId: string, fileId: string): Promise<void> {
  // Delete from local metadata and blob store
  try {
    const key = `${LOCAL_FILES_META_KEY}${userId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const existing: StoredFile[] = JSON.parse(raw);
      const filtered = existing.filter((f) => f.id !== fileId);
      localStorage.setItem(key, JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }

  await deleteLocalBlob(fileId);

  // If signed in to Firestore, delete document
  if (auth.currentUser && auth.currentUser.uid === userId) {
    const fileRef = doc(db, 'users', userId, 'files', fileId);
    try {
      await deleteDoc(fileRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}/files/${fileId}`);
    }
  }
}

// Utility: blob to data url
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Utility: data url to blob
function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

