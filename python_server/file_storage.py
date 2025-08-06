import os
import shutil
from pathlib import Path
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

class FileStorageService:
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(exist_ok=True)
        logger.info(f"File storage initialized at: {self.upload_dir.absolute()}")
    
    def save_uploaded_file(self, file_content: bytes, original_filename: str) -> tuple[str, str]:
        """
        Save uploaded file to storage
        
        Returns:
            Tuple of (upload_id, file_path)
        """
        # Generate unique upload ID
        upload_id = str(uuid.uuid4())
        
        # Create upload directory for this file
        upload_path = self.upload_dir / upload_id
        upload_path.mkdir(exist_ok=True)
        
        # Save file with original name
        file_path = upload_path / original_filename
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        logger.info(f"Saved uploaded file: {file_path}")
        return upload_id, str(file_path)
    
    def get_file_path(self, upload_id: str, filename: str) -> str:
        """Get the full path to a stored file"""
        return str(self.upload_dir / upload_id / filename)
    
    def file_exists(self, upload_id: str, filename: str) -> bool:
        """Check if a file exists in storage"""
        file_path = self.upload_dir / upload_id / filename
        return file_path.exists()
    
    def delete_file(self, upload_id: str, filename: str) -> bool:
        """Delete a file from storage"""
        try:
            file_path = self.upload_dir / upload_id / filename
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Deleted file: {file_path}")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to delete file {filename}: {e}")
            return False
    
    def delete_upload_directory(self, upload_id: str) -> bool:
        """Delete entire upload directory"""
        try:
            upload_path = self.upload_dir / upload_id
            if upload_path.exists():
                shutil.rmtree(upload_path)
                logger.info(f"Deleted upload directory: {upload_path}")
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to delete upload directory {upload_id}: {e}")
            return False
    
    def get_storage_stats(self) -> dict:
        """Get storage statistics"""
        try:
            total_files = 0
            total_size = 0
            
            for upload_dir in self.upload_dir.iterdir():
                if upload_dir.is_dir():
                    for file_path in upload_dir.iterdir():
                        if file_path.is_file():
                            total_files += 1
                            total_size += file_path.stat().st_size
            
            return {
                "total_files": total_files,
                "total_size_bytes": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "upload_directories": len([d for d in self.upload_dir.iterdir() if d.is_dir()])
            }
        except Exception as e:
            logger.error(f"Failed to get storage stats: {e}")
            return {
                "total_files": 0,
                "total_size_bytes": 0,
                "total_size_mb": 0,
                "upload_directories": 0
            }

# Global file storage service instance
file_storage = FileStorageService() 