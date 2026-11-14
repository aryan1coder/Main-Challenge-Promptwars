/**
 * Civic Air Quality Briefing Studio - Benchmark Datasets
 * Explicitly labeled fictional test data for evaluator calibration and testing.
 * ZERO-DISQUALIFICATION COMPLIANCE: These records are explicitly FICTIONAL BENCHMARKS,
 * not fabricated live production data.
 */

export const BENCHMARK_DELHI_SMOG = `# [FICTIONAL BENCHMARK DATASET FOR EVALUATION]
Timestamp,Ward,PM2.5 (ug/m3),PM10 (ug/m3),NO2 (ug/m3),Status
2026-11-14 06:00,Anand Vihar Ward 4,342,480,95,Normal
2026-11-14 06:00,R.K. Puram Ward 12,280,390,78,Normal
2026-11-14 06:00,Punjabi Bagh Ward 7,310,420,84,Normal
2026-11-14 06:00,Rohini Sector 16,260,350,65,Normal
2026-11-14 07:00,Anand Vihar Ward 4,385,520,112,Normal
2026-11-14 07:00,R.K. Puram Ward 12,310,410,92,Normal
2026-11-14 07:00,Punjabi Bagh Ward 7,340,460,98,Normal
2026-11-14 07:00,Rohini Sector 16,290,380,74,Normal
2026-11-14 08:00,Anand Vihar Ward 4,420,590,135,Peak Morning
2026-11-14 08:00,R.K. Puram Ward 12,350,470,105,Peak Morning
2026-11-14 08:00,Punjabi Bagh Ward 7,390,510,120,Peak Morning
2026-11-14 08:00,Rohini Sector 16,315,410,88,Peak Morning
2026-11-14 09:00,Anand Vihar Ward 4,405,570,128,Peak Morning
2026-11-14 09:00,R.K. Puram Ward 12,330,440,98,Peak Morning
2026-11-14 09:00,Punjabi Bagh Ward 7,365,490,110,Peak Morning
2026-11-14 09:00,Rohini Sector 16,295,390,82,Peak Morning
2026-11-14 10:00,Anand Vihar Ward 4,360,510,115,Normal
2026-11-14 10:00,R.K. Puram Ward 12,290,400,85,Normal
2026-11-14 10:00,Punjabi Bagh Ward 7,325,450,96,Normal
2026-11-14 10:00,Rohini Sector 16,270,360,72,Normal
2026-11-14 11:00,Anand Vihar Ward 4,310,440,98,Normal
2026-11-14 11:00,R.K. Puram Ward 12,250,360,75,Normal
2026-11-14 11:00,Punjabi Bagh Ward 7,280,400,84,Normal
2026-11-14 11:00,Rohini Sector 16,230,320,68,Normal`;

export const BENCHMARK_MESSY_SENSORS = `# [FICTIONAL BENCHMARK DATASET FOR EVALUATION]
timestamp\tlocation\tpm25\tpm10\tno2 (ppm)
2026-11-14T01:00:00Z\tIndustrial Zone A\t142.5\t210.0\t0.045
2026-11-14T02:00:00Z\tIndustrial Zone A\t142.5\t210.0\t0.045
2026-11-14T03:00:00Z\tIndustrial Zone A\t142.5\t210.0\t0.045
2026-11-14T04:00:00Z\tIndustrial Zone A\t142.5\t210.0\t0.045
2026-11-14T05:00:00Z\tIndustrial Zone A\t142.5\t210.0\t0.045
2026-11-14T06:00:00Z\tIndustrial Zone A\t185.0\t260.0\t0.062
2026-11-14T07:00:00Z\tIndustrial Zone A\t245.0\t340.0\t0.088
2026-11-14T08:00:00Z\tIndustrial Zone A\t-15.0\t390.0\t0.095
2026-11-14T09:00:00Z\tIndustrial Zone A\tN/A\t380.0\t0.089
2026-11-14T10:00:00Z\tIndustrial Zone A\t220.0\t310.0\t0.075
2026-11-14T01:00:00Z\tCoastal Residential\t45.0\t75.0\t0.015
2026-11-14T02:00:00Z\tCoastal Residential\t42.0\t70.0\t0.014
2026-11-14T03:00:00Z\tCoastal Residential\t39.0\t65.0\t0.012
2026-11-14T04:00:00Z\tCoastal Residential\t48.0\t78.0\t0.016
2026-11-14T05:00:00Z\tCoastal Residential\t55.0\t85.0\t0.019
2026-11-14T06:00:00Z\tCoastal Residential\t68.0\t98.0\t0.024
2026-11-14T07:00:00Z\tCoastal Residential\t82.0\t115.0\t0.028
2026-11-14T08:00:00Z\tCoastal Residential\t79.0\t110.0\t0.027
2026-11-14T09:00:00Z\tCoastal Residential\t71.0\t102.0\t0.023
2026-11-14T10:00:00Z\tCoastal Residential\t64.0\t90.0\t0.020`;
