# TapMap Phase 1: Google Cloud Setup

This project setup is for your Phase 1 responsibilities only.

## 1. Create and select project
```bash
gcloud projects create tapmap-cheesehacks-2026 --name="TapMap"
gcloud config set project tapmap-cheesehacks-2026
```

## 2. Enable required APIs
```bash
gcloud services enable run.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable maps-backend.googleapis.com
```

## 3. Create Firestore database
```bash
gcloud firestore databases create --location=us-central1 --type=firestore-native
```

## 4. Cloud Run config
- Placeholder service config is in `backend/cloudrun.service.yaml`.
- Replace `PROJECT_ID` with your real project ID before deploy.

## 5. Google Maps API key
1. Go to Google Cloud Console -> APIs & Services -> Credentials.
2. Create API key.
3. Restrict key to Geocoding API and your frontend origin.
4. Add key to `frontend/.env`:
```bash
VITE_GOOGLE_MAPS_API_KEY=YOUR_KEY
VITE_API_BASE_URL=http://localhost:5000
```
