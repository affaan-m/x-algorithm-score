# Extension Insights Audit

## Purpose
This document catalogs every user-facing insight/suggestion in the extension and classifies each as either:
- **VERIFIED**: Traceable to a specific source in `xai-org/x-algorithm` or `twitter/the-algorithm`
- **HEURISTIC**: Based on community research, best practices, or reasonable inference

Last audit: 2026-02-05

---

## Insights in `InsightsSection.tsx` (lines 7-24)

### 1. "Reply-to-Reply = 75x Value"
- **Status**: HEURISTIC/UNVERIFIED
- **Claim**: "When you respond to replies on your tweet, it generates 75x more algorithmic value than a like"
- **Source**: NOT FOUND in `xai-org/x-algorithm`
- **Note**: The upstream README mentions multi-action prediction but does not specify exact multipliers. The `WeightedScorer` uses configurable weights from `params`, which are not published in the open repo.

### 2. "Native Video = 10x Reach"
- **Status**: HEURISTIC/UNVERIFIED
- **Claim**: "Videos uploaded directly to X get 10x more engagement than text-only posts"
- **Source**: NOT FOUND in `xai-org/x-algorithm`
- **Note**: The upstream repo confirms VQV (video quality view) scoring exists (`vqv_score`, `video_duration_ms > MIN_VIDEO_DURATION_MS`), but does not specify a "10x" multiplier.

### 3. "Links Kill Non-Premium Reach"
- **Status**: HEURISTIC/UNVERIFIED
- **Claim**: "Since March 2026, non-Premium accounts with external links get ~0% median engagement"
- **Source**: NOT FOUND in `xai-org/x-algorithm`
- **Note**: No evidence of link penalties in the open-source code. May be based on community observation/experimentation.

### 4. "Questions Drive 13-27x Replies"
- **Status**: HEURISTIC/UNVERIFIED
- **Claim**: "Tweets with questions generate significantly more reply engagement, which is weighted heavily by the algorithm"
- **Source**: NOT FOUND in `xai-org/x-algorithm`
- **Note**: The upstream scorer includes `reply_score` with configurable `REPLY_WEIGHT`, but no specific multiplier values.

---

## Comments in `scoring-engine.ts` (lines 1-32)

### 5. "Reply-to-reply (conversation): 75x baseline" (line 12)
- **Status**: HEURISTIC/UNVERIFIED
- **Source**: NOT FOUND

### 6. "Direct replies: 13.5x to 27x baseline" (line 13)
- **Status**: HEURISTIC/UNVERIFIED
- **Source**: NOT FOUND

### 7. "Quote tweets: Higher than retweets" (line 14)
- **Status**: HEURISTIC/UNVERIFIED
- **Source**: NOT FOUND

### 8. "Retweets: 1-2x baseline" (line 15)
- **Status**: HEURISTIC/UNVERIFIED
- **Source**: NOT FOUND

### 9. "Likes: 0.5x baseline (LOWEST value)" (line 16)
- **Status**: HEURISTIC/UNVERIFIED
- **Source**: NOT FOUND

### 10. "Reports: -369x (devastating)" (line 19)
- **Status**: HEURISTIC/UNVERIFIED
- **Source**: NOT FOUND

### 11. "Blocks/mutes: -74x" (line 20)
- **Status**: HEURISTIC/UNVERIFIED
- **Source**: NOT FOUND

### 12. "TweepCred score: Below 0.65 = only 3 tweets considered" (line 24)
- **Status**: HEURISTIC/COMMUNITY RESEARCH
- **Source**: NOT FOUND in open-source code
- **Note**: TweepCred is likely internal to X and not exposed

### 13. "Dwell time: Users must stay >3 seconds" (line 25)
- **Status**: HEURISTIC/UNVERIFIED
- **Source**: NOT FOUND
- **Note**: Upstream includes `dwell_score` and `dwell_time` but no threshold

### 14. "Premium is critical: Non-Premium link posts get ZERO median engagement" (line 26)
- **Status**: HEURISTIC/UNVERIFIED
- **Source**: NOT FOUND

### 15. "First 30 minutes: Critical window" (line 28)
- **Status**: HEURISTIC/BEST PRACTICE
- **Source**: NOT FOUND

### 16. "Native video: 10x more engagement" (line 29)
- **Status**: HEURISTIC/UNVERIFIED
- **Source**: NOT FOUND

---

## Verified Elements from `xai-org/x-algorithm`

### VERIFIED: Multi-Action Prediction
- **Source**: [README.md](https://raw.githubusercontent.com/xai-org/x-algorithm/main/README.md) (Scoring and Ranking section)
- **Evidence**: The Phoenix scorer predicts probabilities for multiple actions:
  ```
  P(favorite), P(reply), P(repost), P(quote), P(click), 
  P(profile_click), P(video_view), P(photo_expand), P(share), 
  P(dwell), P(follow_author), P(not_interested), P(block_author), 
  P(mute_author), P(report)
  ```

### VERIFIED: Weighted Score Combination
- **Source**: [weighted_scorer.rs](https://raw.githubusercontent.com/xai-org/x-algorithm/main/home-mixer/scorers/weighted_scorer.rs)
- **Evidence**: 
  ```rust
  combined_score = apply(favorite_score, FAVORITE_WEIGHT)
                 + apply(reply_score, REPLY_WEIGHT)
                 + apply(retweet_score, RETWEET_WEIGHT)
                 + apply(photo_expand_score, PHOTO_EXPAND_WEIGHT)
                 + apply(click_score, CLICK_WEIGHT)
                 + apply(profile_click_score, PROFILE_CLICK_WEIGHT)
                 + apply(vqv_score, vqv_weight)
                 + apply(share_score, SHARE_WEIGHT)
                 + apply(share_via_dm_score, SHARE_VIA_DM_WEIGHT)
                 + apply(share_via_copy_link_score, SHARE_VIA_COPY_LINK_WEIGHT)
                 + apply(dwell_score, DWELL_WEIGHT)
                 + apply(quote_score, QUOTE_WEIGHT)
                 + apply(quoted_click_score, QUOTED_CLICK_WEIGHT)
                 + apply(dwell_time, CONT_DWELL_TIME_WEIGHT)
                 + apply(follow_author_score, FOLLOW_AUTHOR_WEIGHT)
                 + apply(not_interested_score, NOT_INTERESTED_WEIGHT)
                 + apply(block_author_score, BLOCK_AUTHOR_WEIGHT)
                 + apply(mute_author_score, MUTE_AUTHOR_WEIGHT)
                 + apply(report_score, REPORT_WEIGHT)
  ```

### VERIFIED: VQV (Video) Eligibility Gating
- **Source**: [weighted_scorer.rs](https://raw.githubusercontent.com/xai-org/x-algorithm/main/home-mixer/scorers/weighted_scorer.rs) (lines 72-81)
- **Evidence**:
  ```rust
  fn vqv_weight_eligibility(candidate: &PostCandidate) -> f64 {
      if candidate.video_duration_ms.is_some_and(|ms| ms > MIN_VIDEO_DURATION_MS) {
          VQV_WEIGHT
      } else {
          0.0
      }
  }
  ```
- **Note**: Video duration threshold exists, but actual weight values are in `params` (not public)

### VERIFIED: Negative Score Offset Handling
- **Source**: [weighted_scorer.rs](https://raw.githubusercontent.com/xai-org/x-algorithm/main/home-mixer/scorers/weighted_scorer.rs) (lines 83-91)
- **Evidence**:
  ```rust
  fn offset_score(combined_score: f64) -> f64 {
      if WEIGHTS_SUM == 0.0 {
          combined_score.max(0.0)
      } else if combined_score < 0.0 {
          (combined_score + NEGATIVE_WEIGHTS_SUM) / WEIGHTS_SUM * NEGATIVE_SCORES_OFFSET
      } else {
          combined_score + NEGATIVE_SCORES_OFFSET
      }
  }
  ```

### VERIFIED: Author Diversity Scoring
- **Source**: [author_diversity_scorer.rs](https://raw.githubusercontent.com/xai-org/x-algorithm/main/home-mixer/scorers/author_diversity_scorer.rs)
- **Evidence**: Applies exponential decay to repeated authors: `(1.0 - floor) * decay_factor^position + floor`

### VERIFIED: OON (Out-of-Network) Penalty
- **Source**: [oon_scorer.rs](https://raw.githubusercontent.com/xai-org/x-algorithm/main/home-mixer/scorers/oon_scorer.rs)
- **Evidence**: Out-of-network posts get `base_score * OON_WEIGHT_FACTOR`

### VERIFIED: Candidate Isolation in Ranking
- **Source**: [README.md](https://raw.githubusercontent.com/xai-org/x-algorithm/main/README.md) (Key Design Decisions)
- **Evidence**: "During transformer inference, candidates cannot attend to each other—only to the user context"

### VERIFIED: No Hand-Engineered Features
- **Source**: [README.md](https://raw.githubusercontent.com/xai-org/x-algorithm/main/README.md)
- **Evidence**: "We have eliminated every single hand-engineered feature and most heuristics from the system"

### VERIFIED: Sequential Filters, Parallel Sources/Hydrators
- **Source**: [candidate_pipeline.rs](https://raw.githubusercontent.com/xai-org/x-algorithm/main/candidate-pipeline/candidate_pipeline.rs)
- **Evidence**: 
  - `fetch_candidates`: `join_all(source_futures)` (parallel)
  - `hydrate`: `join_all(hydrate_futures)` (parallel)
  - `filter`: sequential loop over filters
  - `score`: sequential loop over scorers

---

## Summary

### Verified (9 items)
1. Multi-action prediction architecture
2. Weighted score combination formula
3. VQV video duration gating
4. Negative score offset handling
5. Author diversity exponential decay
6. OON penalty factor
7. Candidate isolation in transformer
8. No hand-engineered features principle
9. Pipeline parallelization strategy

### Heuristic/Unverified (16 items)
1. 75x reply-to-reply multiplier
2. 13-27x direct reply multiplier
3. 10x video engagement claim
4. 0.5x like multiplier
5. -369x report multiplier
6. -74x block/mute multiplier
7. Links kill non-Premium reach
8. TweepCred < 0.65 threshold
9. 3-second dwell time threshold
10. First 30 minutes critical window
11. Questions drive 13-27x replies (duplicate of #2)
12. Template content detection penalties
13. Positive sentiment boost
14. Negative sentiment penalty
15. Optimal character length (71-280)
16. Sweet spot length (120-240)

### Recommendation
The extension should clearly label which insights are:
- **"From open-source code"**: Only the 9 verified items
- **"Based on community research"**: All heuristics
- **Avoid specific multiplier numbers** unless they can be traced to public sources
