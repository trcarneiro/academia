# 🔒 SSL Certificates Directory

This directory contains **self-signed SSL certificates** for local HTTPS development.

## ⚠️ SECURITY WARNING

**DO NOT COMMIT THESE FILES TO VERSION CONTROL!**

This folder is ignored by `.gitignore` for security reasons.

## 📁 Expected Files

After running `npm run cert:generate`, you should have:

- `server.key` - Private key (SENSITIVE!)
- `server.pem` - Certificate in PEM format
- `server.pfx` - Certificate in PFX format (Windows)
- `server.crt` - Certificate public key

## 🔧 How to Generate

```bash
npm run cert:generate
```

This will:
1. Create this `certs/` directory
2. Generate SSL certificate valid for 1 year
3. Include IPs: 192.168.100.37, localhost, 127.0.0.1
4. Password for PFX: `academia2025`

## 🔐 How to Trust (Windows)

```bash
# Run PowerShell as Administrator
npm run cert:trust
```

This will add the certificate to Windows Trusted Root Certification Authorities.

## 🗑️ How to Remove

If you need to regenerate or remove certificates:

```bash
# Delete all files
Remove-Item -Path ./certs/* -Force

# Regenerate
npm run cert:generate
```

## ⏰ Validity

Certificates are valid for **1 year** from generation date.

To check expiration:

```powershell
# PowerShell
$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2("./certs/server.crt")
Write-Host "Valid until: $($cert.NotAfter)"
```

## 🔄 Renewal

Before expiration, simply run:

```bash
npm run cert:generate
```

Then restart the server.

## 📚 Documentation

- Full guide: `HTTPS_IMPLEMENTATION_COMPLETE.md`
- Quick reference: `CAMERA_NETWORK_QUICK.md`
- Notebook tutorial: `CAMERA_NETWORK_FIX.ipynb`

---

**Last Updated**: 18 de outubro de 2025  
**Purpose**: Enable camera access via HTTPS on local network
