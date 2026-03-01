# Phase 2 Full QA Results

## Contract - PASS (6/6)
- PASS: GET /api/health status 200 :: 200
- PASS: GET /api/health body contains ok true :: {"ok": true}
- PASS: GET /api/wells status 200 :: 200
- PASS: GET /api/wells wells list present :: list
- PASS: POST /api/score status 200 :: 200
- PASS: POST /api/score response keys present :: dict_keys(['breakdown', 'grade', 'lastUpdated', 'limits', 'outOfZone', 'score', 'wellIds', 'zoneId'])

## Integration - PASS (6/6)
- PASS: Wells count >= 20 :: 22
- PASS: Well IDs unique :: total=22, unique=22
- PASS: Well grade matches score band :: []
- PASS: Well riskLevel in [0,100] :: []
- PASS: Score at well coordinate maps to same well id :: missed=0 sample=[]
- PASS: Well 15 lower score than Well 7 :: 15=60.8 7=96.8

## Negative - PASS (5/5)
- PASS: /api/score invalid payload -> type string lat :: 400
- PASS: /api/score invalid payload -> lat out of range :: 400
- PASS: /api/score invalid payload -> missing lng :: 400
- PASS: /api/score invalid payload -> empty json :: 400
- PASS: /api/submit missing fields returns 400 :: 400

## Performance - PASS (3/3)
- PASS: GET /api/health p95 < 120ms :: {"avg_ms": 0.2851899999222951, "p95_ms": 0.4797000001417473, "max_ms": 1.750800001900643}
- PASS: GET /api/wells p95 < 120ms :: {"avg_ms": 0.5429630000071484, "p95_ms": 0.9840999991865829, "max_ms": 1.931699996930547}
- PASS: POST /api/score p95 < 120ms :: {"avg_ms": 0.9031950001008227, "p95_ms": 1.5522000030614436, "max_ms": 2.639300000737421}

## Resilience - PASS (3/3)
- PASS: /api/score malformed JSON returns 400 :: 400
- PASS: /api/submit wrong content-type returns 400 :: 400
- PASS: /api/wells returns 503 when engine fails to initialize :: 503

## Privacy - PASS (2/2)
- PASS: /api/submit response omits raw lat/lng :: {"geohash": "stubgh6", "stored": true, "submissionId": "stub-14f993fa"}
- PASS: /api/score response omits input lat/lng fields :: {"breakdown": {"infrastructure": 6.88, "lead": 4.275, "nitrate": 0.6, "pfas": 0.0, "violations": 0, "voc": 0.2}, "grade": "B", "lastUpdated": "2025-03-25", "limits": {"lead": 15.0, "nitrate": 10.0, "pfas": 9.0, "voc": 5.0}, "outOfZone": true, "score": 89.9, "wellIds": ["27"], "zoneId": "27"}

Overall: PASS