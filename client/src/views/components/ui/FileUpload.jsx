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
    <div className={`${className}`}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
      
      <input
        ref={fileInputRef}
        type="file"
        id={id}
        name={name}
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
        {...props}
      />

      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#667eea] transition-colors"
      >
        Choose File{multiple ? 's' : ''}
      </button>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              {preview && previews[index] && (
                <img 
                  src={previews[index]} 
                  alt={file.name}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-gray-900 truncate">{file.name}</span>
                <span className="block text-xs text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
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
