GYMON MATERIAL — the only facts about Gymon an article may state. Every article carries exactly one "gymon" block built from ONE of the three parts below. Never invent app data, user numbers, user quotes or experiences. Sources are noted in brackets for the reviewer (files in the gymon app repo or research folder); do not put them in the article.

A. THE LOGGING TABLE (kind "log-example") [app/src/lib/loggerData.ts, personalRecords.ts, repRange.ts]
- Gymon's logger shows each set as one row: SET | PREVIOUS | KG | REPS | ✓.
- PREVIOUS shows, in grey, the weight and reps of the same set in the last finished session of the SAME workout (not the exercise's last outing in some other workout).
- Only working sets count: warm-up and cool-down sets are not used for PREVIOUS or for records.
- A personal record in Gymon: the heaviest weight wins; on equal weight, more reps win; a tie is not a record; a first-ever session cannot set a record; timed exercises have no weight/reps record.
- Rep targets are shown as a range (for example 8 to 12), not a single number.
- A log-example uses ILLUSTRATIVE numbers that you choose for the example. The page labels them "illustrative, not user data". Keep them realistic and consistent: small weight steps (1 to 2.5 kg), reps that fall slightly as weight rises, PREVIOUS equal to the earlier session's numbers.

B. THE PLAN BUILDER (kind "plan-logic") [app/src/lib/planBuilder.ts, programRotation.ts]
- The plan is built in four steps: filter exercises by where the person trains, pick a split from the number of training days, choose exercises for each day, then set sets, reps and rest from the goal and experience level.
- Split by days per week: 1 day full body; 2 days full body A and B; 3 days full body A, B and C; 4 days upper and lower twice; 5 days push, pull, legs, upper, lower; 6 days push, pull and legs twice. Legs appear in every split.
- Main lifts by goal: strength 4 to 6 reps, 4 sets, 180 seconds rest; muscle 8 to 12 reps, 3 sets, 90 seconds rest. Accessory exercises: strength 8 to 12 reps; muscle 10 to 15 reps.
- Sets per exercise stay between 2 and 4: main lifts 3 to 4, isolation exercises 2 to 3. When a muscle needs more work in a session, the plan adds an exercise rather than stacking sets on one.
- Session length decides how many exercises fit: a 60-minute session holds about 20 to 23 working sets, a 45-minute session about 15 to 17.
- Gender does not change the prescription: it is a decision, because nothing in the evidence used supports a different rule.
- "Toning" gets the same resistance work as building muscle; it is not a light-weights, high-reps protocol.
- When possible, a session holds only one exercise that loads the hip hinge (for example a deadlift), so the lower back is not loaded twice.
- The program-refresh check estimates each session's best set with the Epley formula (weight × (1 + reps ÷ 30)). It asks about swapping an exercise only when that lift's best estimate has not improved by at least 1% across 4 sessions of it and the best is at least 3 weeks old, and never before 6 weeks on the plan. It only asks; it never swaps an exercise by itself.

C. GYMON'S REVIEW OF WORKOUT APPS (kind "teardown-finding") [departments/research/competitor_analysis, 2026]
- Gymon mapped the onboarding and logging screens of 8 workout apps, 402 screens in total.
- Strong and Hevy, built separately, arrived at the same set table: SET | PREVIOUS | KG | REPS | ✓.
- Of the 7 apps reviewed for language support, only one (FitBuddy, an Israeli app) offered Hebrew with a right-to-left layout.
- Hevy labels set types (warm-up, failure, drop set) and tracks 4 kinds of record: heaviest weight, best 1RM, best set volume and best session volume.
- In 281 negative app-store reviews of Strong, Fitbod and Hevy, the most common complaint (119 reviews, 42%) was about pricing and paywalls imposed after people had already invested time and data.
- When naming competitor apps, state only these findings; no rankings, no prices, no "better than" claims.
