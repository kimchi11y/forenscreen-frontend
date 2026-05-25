# ForenScreen Dashboard - Quick Start Guide

## Overview
The ForenScreen Dashboard provides a comprehensive interface for digital forensic analysis with three main sections:
- **Register Assets**: Upload original files to establish authenticity baselines
- **Analyze Evidence**: Compare evidence files against registered assets with forensic analysis
- **Compare**: Side-by-side visual comparison with detailed forensic results

## Features

### 🔒 Secure Asset Registration
- SHA-256 cryptographic signatures
- Perceptual hashing (pHash) for visual matching
- Secure storage in Neon DB ledger
- Chain of custody tracking

### 🔍 Comprehensive Forensic Analysis
- Error Level Analysis (ELA) for edit detection
- Compression artifact analysis
- Color profile examination
- Manipulation indicators
- Visual similarity matching

### 📊 Side-by-Side Comparison
- Visual comparison interface
- Cryptographic verification status
- Detailed forensic breakdowns
- Match/mismatch indicators

## Starting the Application

### 1. Start the Backend Server
```bash
cd /Users/hakim/Workspace/Forenscreen/backend
python main.py
```
The backend will run on `http://localhost:8000`

### 2. Start the Frontend Development Server
```bash
cd /Users/hakim/Workspace/Forenscreen/frontend
npm run dev
```
The frontend will run on `http://localhost:5173` (or similar)

## Usage Workflow

### Step 1: Register Original Assets
1. Navigate to the "Register Assets" tab
2. Upload authentic, unmodified files
3. Files are cryptographically registered in the secure ledger
4. Note the asset ID for reference

### Step 2: Analyze Evidence
1. Navigate to the "Analyze Evidence" tab
2. Upload potential evidence files
3. System performs:
   - Visual similarity search using pHash
   - Cryptographic integrity verification
   - Comprehensive forensic analysis
4. Review verification status:
   - **VERIFIED_AUTHENTIC**: Exact match with registered asset
   - **TAMPERED_MANIPULATED**: Visual match but different cryptographic hash
   - **UNREGISTERED_ASSET**: No similar asset found in database

### Step 3: Compare Results
1. Navigate to the "Compare" tab
2. View side-by-side comparison
3. Review forensic analysis details
4. Check manipulation indicators
5. Verify cryptographic signatures

## Understanding Verification Statuses

### ✅ VERIFIED_AUTHENTIC
- Cryptographic hashes match exactly
- File is identical to registered asset
- No tampering detected

### ❌ TAMPERED_MANIPULATED
- Visual similarity detected
- Cryptographic hashes differ
- File has been modified after registration

### ⚠️ UNREGISTERED_ASSET
- No similar asset found in database
- Cannot verify authenticity
- May need to register original first

## Forensic Indicators Explained

### ELA Score (Error Level Analysis)
- **0-8**: Low manipulation likelihood
- **8-15**: Medium manipulation likelihood
- **15+**: High manipulation likelihood

### Color Variance
- Low variance may indicate screenshots or digital content
- High variance suggests natural photos

### Compression Analysis
- JPEG artifacts may obscure edits
- PNG preserves detail for screenshots

## Technical Details

### Cryptographic Hashes
- **SHA-256**: Used for exact file integrity verification
- **pHash**: Perceptual hash for visual similarity matching
- **Hamming Distance**: Measures similarity between perceptual hashes

### Backend Endpoints
- `POST /upload-asset/`: Register original asset
- `POST /upload`: Analyze evidence file
- `GET /view-asset/{id}`: Retrieve registered asset image

### Data Storage
- **Neon DB**: Secure PostgreSQL database for asset registry
- **Local Storage**: Temporary backup in `/uploads` directory
- **File Registry**: JSON-based duplicate tracking

## Troubleshooting

### Backend Connection Issues
- Ensure backend is running on port 8000
- Check CORS settings in main.py
- Verify database connection

### Upload Failures
- Check file size limits
- Ensure valid image formats (PNG, JPG, GIF)
- Verify file permissions

### Analysis Not Working
- Ensure file is a valid image
- Check backend logs for errors
- Verify database has registered assets

## Technologies Used

### Frontend
- **React 19**: UI framework
- **Vite**: Build tool
- **Tailwind CSS**: Styling
- **shadcn**: UI components
- **lucide-react**: Icons
- **React Router**: Navigation

### Backend
- **FastAPI**: Web framework
- **SQLAlchemy**: ORM
- **Neon DB**: PostgreSQL database
- **PIL/Pillow**: Image processing
- **imagehash**: Perceptual hashing
- **NumPy**: Numerical operations

## Security Considerations

- All registered assets are cryptographically signed
- SHA-256 provides tamper-evident verification
- pHash enables detection of visual modifications
- Database maintains immutable chain of custody
- Local files serve as backup evidence

## Future Enhancements

- [ ] Batch file upload
- [ ] Video file support
- [ ] Advanced metadata extraction
- [ ] Export forensic reports
- [ ] Case management integration
- [ ] Multi-user collaboration
- [ ] Advanced visualization tools
- [ ] Machine learning enhancement detection