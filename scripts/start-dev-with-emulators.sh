#!/bin/bash
# Start Firebase emulators in background, then start Next.js dev server

# Start Firebase emulators in background
echo "Starting Firebase emulators..."
firebase emulators:start --only firestore,auth > /tmp/firebase-emulators.log 2>&1 &
EMULATOR_PID=$!

# Wait for emulators to be ready (check if port 8080 is listening)
echo "Waiting for emulators to start..."
for i in {1..30}; do
  if nc -z 127.0.0.1 8080 2>/dev/null; then
    echo "Emulators are ready!"
    break
  fi
  sleep 1
done

# Start Next.js dev server with emulator env vars
echo "Starting Next.js dev server..."
ENABLE_TEST_AUTH=true FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_EMULATOR_HUB=http://127.0.0.1:4000 npm run dev

# Cleanup: kill emulators when dev server exits
trap "kill $EMULATOR_PID 2>/dev/null" EXIT
