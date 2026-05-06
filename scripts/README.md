# 🚨 EMERGENCY COORDINATION SCRIPTS

## **CRITICAL: Break the Fix→Expand→Duplicate Cycle**

These scripts are for **ALL AGENTS** to prevent the 2-3 minute duplication cycle.

## **QUICK START**

### **1. Install Pre-Commit Hook (MANDATORY)**
```bash
cp pre-commit-hook-example .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```
This will **BLOCK COMMITS** with duplicate cosmic sight names locally.

### **2. Check for Duplicates**
```bash
node check-cosmic-sight-uniqueness.js
```
Shows: `X entries / Y unique / Z duplicate labels`

### **3. Fix Duplicates (Emergency)**
```bash
node emergency_deduplicate_72_duplicates.js
```
One-command fix for any duplicate situation.

## **COORDINATION PROTOCOL**

### **Velocity Limits:**
- **MAXIMUM**: 20 sights/minute
- **Checkpoint**: Validate every 100 sights
- **Batch size**: ≤25 sights per commit

### **Handoff Signals:**
- 🚨 `DEDUPLICATION COMPLETE` → Expansion may resume
- ⚠️ `EXPANSION PAUSE` → Running validation checkpoint  
- ✅ `VALIDATION PASSED` → Continue expansion
- 🚨🚨🚨 `EMERGENCY STOP` → ALL EXPANSION STOPS

### **Emergency Response:**
1. **STOP** all expansion immediately
2. **Run** `node check-cosmic-sight-uniqueness.js`
3. **Fix** with `node emergency_deduplicate_N_duplicates.js`
4. **Verify** with `npm test`
5. **Resume** only after 0 duplicates confirmed

## **TRUE MILESTONE TRACKING**

Celebrate only **VERIFIED UNIQUE COUNTS**:
- 7,500 → Actually 7,253 (247 duplicates)
- 8,000 → Actually 7,943 (57 duplicates)  
- 8,400 → Actually 8,226 (174 duplicates)
- 8,500 → Actually 8,500 ✅ (0 duplicates)
- 8,954 → Actually 8,954 ✅ (0 duplicates)

## **GITHUB ACTIONS FIX**

New strict workflow: `.github/workflows/validate-universe-strict.yml`
- **Blocks pushes** with duplicates
- **Clear error messages**
- **Two-stage validation**

## **TEAM RESPONSIBILITIES**

1. **ALL AGENTS**: Install pre-commit hook
2. **Expansion Team**: Respect 20 sights/minute limit
3. **Technical Team**: Run fixes when alerted
4. **Coordination Team**: Signal handoffs and emergencies

---

**Current Status**: 8,954 cosmic sights, 0 duplicates ✅  
**Next Checkpoint**: 9,000 sights  
**Maximum Velocity**: 20 sights/minute  

**LET'S BREAK THE CYCLE!** 🚀
