'use client';

import React, {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
} from 'react';
import { useDropzone } from 'react-dropzone';

type DropzoneProps = {
  value?: File[];
  onChange?: (files: File[]) => void;
};

function DropzoneComponent({ value = [], onChange }: DropzoneProps, ref) {
  const [files, setFiles] = useState<File[]>(value);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
    },
    multiple: false,
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles);
      onChange?.(acceptedFiles);
    },
  });

  // Keep internal state in sync with RHF
  useEffect(() => {
    setFiles(value);
  }, [value]);

  useImperativeHandle(ref, () => ({
    getFiles: () => files,
  }));

  return (
    <div
      {...getRootProps()}
      className={`dropzone-container ${isDragActive ? 'active' : ''}`}>
      <input {...getInputProps()} />

      {files.length > 0 ? (
        <div>
          <p style={{ fontSize: '2.5rem', margin: '0 0 10px 0' }}>🖼️</p>
          <p
            style={{
              fontWeight: 700,
              fontSize: '1.1rem',
              marginBottom: '5px',
            }}>
            {files[0].name}
          </p>
          <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
            {(files[0].size / 1024 / 1024).toFixed(2)} MB
          </p>
          <p style={{ fontSize: '0.9rem', marginTop: '10px', opacity: 0.8 }}>
            Click or drag to replace
          </p>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: '3rem', margin: '0 0 15px 0' }}>📸</p>
          {isDragActive ? (
            <>
              <p style={{ fontWeight: 700, fontSize: '1.2rem' }}>
                Drop your thumbnail here!
              </p>
              <p style={{ opacity: 0.7 }}>Release to upload</p>
            </>
          ) : (
            <>
              <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                Drag & drop your video thumbnail
              </p>
              <p style={{ opacity: 0.7, marginBottom: '8px' }}>
                or click to select a file
              </p>
              <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>
                JPG, PNG or GIF • Max 10MB
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default forwardRef(DropzoneComponent);
