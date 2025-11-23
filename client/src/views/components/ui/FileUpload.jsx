import React from 'react';

const FileUpload = ({ 
  id,
  name,
  label,
  accept,
  multiple = false,
  maxSize,
  maxFiles = 1,
  onChange,
  onError,
  preview = false,
  className = '',
  ...props 
}) => {
  const [files, setFiles] = React.useState([]);
  const [previews, setPreviews] = React.useState([]);
  const fileInputRef = React.useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    if (maxFiles && selectedFiles.length > maxFiles) {
      if (onError) {
        onError(`Maximum ${maxFiles} file(s) allowed`);
      }
      return;
    }

    const validFiles = selectedFiles.filter(file => {
      if (maxSize && file.size > maxSize) {
        if (onError) {
          onError(`File ${file.name} exceeds maximum size of ${maxSize / 1024 / 1024}MB`);
        }
        return false;
      }
      return true;
    });

    setFiles(validFiles);

    if (preview && validFiles.length > 0) {
      const newPreviews = validFiles.map(file => {
        if (file.type.startsWith('image/')) {
          return URL.createObjectURL(file);
        }
        return null;
      }).filter(Boolean);
      setPreviews(newPreviews);
    }

    if (onChange) {
      onChange(multiple ? validFiles : validFiles[0]);
    }
  };

  const handleRemove = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    setFiles(newFiles);
    setPreviews(newPreviews);
    
    if (onChange) {
      onChange(multiple ? newFiles : newFiles[0] || null);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  React.useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previews]);

  return (
    <div className={`file-upload ${className}`}>
      {label && <label className="file-upload-label">{label}</label>}
      
      <input
        ref={fileInputRef}
        type="file"
        id={id}
        name={name}
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="file-upload-input"
        style={{ display: 'none' }}
        {...props}
      />

      <button
        type="button"
        onClick={handleClick}
        className="file-upload-button"
      >
        Choose File{multiple ? 's' : ''}
      </button>

      {files.length > 0 && (
        <div className="file-upload-list">
          {files.map((file, index) => (
            <div key={index} className="file-upload-item">
              {preview && previews[index] && (
                <img 
                  src={previews[index]} 
                  alt={file.name}
                  className="file-upload-preview"
                />
              )}
              <div className="file-upload-info">
                <span className="file-name">{file.name}</span>
                <span className="file-size">
                  {(file.size / 1024).toFixed(2)} KB
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="file-upload-remove"
                aria-label="Remove file"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
