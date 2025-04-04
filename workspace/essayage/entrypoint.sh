#!/bin/bash
uvicorn main:app --host 0.0.0.0 --port 8001 &
tail -f /dev/null