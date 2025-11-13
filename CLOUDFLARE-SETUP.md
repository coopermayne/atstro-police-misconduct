# Cloudflare Setup Guide

## Services Used

This project uses **three** separate Cloudflare services:

1. **Cloudflare Stream** - For video hosting
2. **Cloudflare Images** - For image hosting with responsive delivery
3. **Cloudflare R2** - For document storage (PDFs, etc.)

## Required Secrets (5 Total)

### 1. CLOUDFLARE_ACCOUNT_ID
**Used by:** All services

**How to find it:**
1. Go to https://dash.cloudflare.com
2. Look in the right sidebar under any service
3. Copy the **Account ID**

**Example:** `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p`

---

### 2. CLOUDFLARE_API_TOKEN
**Used by:** Stream and Images uploads

**How to create it:**
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"** → **"Create Custom Token"**
3. **Token name:** `Police Misconduct - Media Upload`
4. **Permissions:**
   - Account → **Stream** → **Edit**
   - Account → **Cloudflare Images** → **Edit**
5. **Account Resources:** Include → Your account
6. Click **"Continue to summary"** → **"Create Token"**
7. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

**Example:** `abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`

---

### 3. CLOUDFLARE_R2_ACCESS_KEY_ID
**Used by:** R2 document storage

**How to create it:**
1. Go to https://dash.cloudflare.com → **R2**
2. Click **"Manage R2 API Tokens"**
3. Click **"Create API token"**
4. **Token name:** `Police Misconduct - Document Upload`
5. **Permissions:** Object Read & Write
6. **Apply to buckets:** Select your bucket (or "Apply to all buckets")
7. Click **"Create API Token"**
8. Copy the **Access Key ID** (first field shown)

**Example:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

---

### 4. CLOUDFLARE_R2_SECRET_ACCESS_KEY
**Used by:** R2 document storage (pairs with #3)

**How to get it:**
- On the **same screen** as step 3
- Copy the **Secret Access Key** (second field)
- **SAVE THIS IMMEDIATELY** - you can't view it again!

**Example:** `abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJ`

---

### 5. CLOUDFLARE_R2_BUCKET_NAME
**Used by:** R2 document storage

**How to find/create:**
1. Go to https://dash.cloudflare.com → **R2**
2. If you don't have a bucket yet, click **"Create bucket"**
   - Name: `police-misconduct` (or your choice)
   - Location: Automatic
3. Copy your bucket name

**Example:** `police-misconduct`

---

## Add to GitHub Codespaces Secrets

1. Go to https://github.com/settings/codespaces
2. Click **"New secret"** for each:

```
Name: CLOUDFLARE_ACCOUNT_ID
Value: [paste your account ID]
Repository access: coopermayne/atstro-police-misconduct
```

```
Name: CLOUDFLARE_API_TOKEN
Value: [paste your API token]
Repository access: coopermayne/atstro-police-misconduct
```

```
Name: CLOUDFLARE_R2_ACCESS_KEY_ID
Value: [paste your R2 access key]
Repository access: coopermayne/atstro-police-misconduct
```

```
Name: CLOUDFLARE_R2_SECRET_ACCESS_KEY
Value: [paste your R2 secret key]
Repository access: coopermayne/atstro-police-misconduct
```

```
Name: CLOUDFLARE_R2_BUCKET_NAME
Value: police-misconduct
Repository access: coopermayne/atstro-police-misconduct
```

---

## Verify Setup

After adding all secrets and **restarting your Codespace**:

```bash
npm run validate:config
```

You should see:
```
✅ ANTHROPIC_API_KEY: sk-ant-...
✅ CLOUDFLARE_ACCOUNT_ID: 1234567...
✅ CLOUDFLARE_API_TOKEN: abc123d...
✅ CLOUDFLARE_R2_ACCESS_KEY_ID: a1b2c3d...
✅ CLOUDFLARE_R2_SECRET_ACCESS_KEY: abcdef...
✅ CLOUDFLARE_R2_BUCKET_NAME: police-misconduct
```

---

## Quick Reference: What Goes Where

| Media Type | Service | Returns | Component |
|------------|---------|---------|-----------|
| Videos (MP4, MOV) | Cloudflare Stream | `videoId` | `<CloudflareVideo videoId="...">` |
| Images (JPG, PNG) | Cloudflare Images | `imageId` | `<CloudflareImage imageId="...">` |
| Documents (PDF) | Cloudflare R2 | Direct URL | Link to file |

---

## Cost Estimates

- **Stream:** $1 per 1,000 minutes stored + $1 per 1,000 minutes delivered
- **Images:** $5 per 100,000 images stored + $1 per 100,000 images delivered
- **R2:** $0.015 per GB stored per month + free egress (no delivery fees!)

For 10-20 cases, expect **< $5/month total**.

---

## Troubleshooting

**"Cloudflare Stream upload failed"**
- Check `CLOUDFLARE_API_TOKEN` has Stream:Edit permission
- Verify `CLOUDFLARE_ACCOUNT_ID` is correct

**"Cloudflare Images upload failed"**  
- Check `CLOUDFLARE_API_TOKEN` has Cloudflare Images:Edit permission
- Ensure Cloudflare Images is enabled on your account

**"R2 upload failed"**
- Verify R2 API token credentials
- Check bucket name matches `CLOUDFLARE_R2_BUCKET_NAME`
- Ensure bucket exists

**Secrets not showing up in Codespace**
- Make sure you selected the correct repository
- **Restart the Codespace** after adding secrets
