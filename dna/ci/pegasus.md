# 🐎 Node .74 (Pi 5) — Hardware Manifest
**Role:** LLM Dreadnought Engine
**Network:** Workgroup, DNS Hostname `pegasus`, IP `192.168.1.74`
**Current OS:** Windows 10 Pro (Build 19045) — *Pending Migration to Ubuntu Server 24.04 LTS*

## ⚙️ Core Hardware
*   **CPU:** Intel® Core™ i7-4790K CPU @ 4.00GHz (4 Cores, 8 Threads)
*   **Memory (RAM):** 16 GB Physical (17 GB Total Virtual)
*   **GPU:** NVIDIA GeForce GTX 980 (4 GB VRAM) — *Maxwell architecture, Compute 5.2*

## 💾 Storage Configuration

### 1. Drive C: (Boot)
*   **Hardware:** Samsung SSD 840 PRO Series (Solid State Drive)
*   **Total Capacity:** 476.94 GB (Raw) / 416.34 GB (Formatted)
*   **Free Space:** 41.53 GB ⚠️ *(Critically low - ~10% free space remaining)*
*   **Status:** OK

### 2. Drive D: (docs)
*   **Hardware:** ST3000DM001-1ER166 (Mechanical HDD)
*   **Total Capacity:** 2.79 TB (2794.52 GB Raw / 2794.39 GB Formatted)
*   **Free Space:** 763.94 GB
*   **Status:** OK
*   **Action Required (Post-Migration):** Due to the low space on the SSD, this drive MUST be mounted out to the `OLLAMA_MODELS` environment variable.

---

<details>
<summary><b>Raw PS System Telemetry (Get-ComputerInfo & WMI)</b></summary>

```text
WindowsBuildLabEx                                       : 19041.1.amd64fre.vb_release.191206-1406
WindowsCurrentVersion                                   : 6.3
WindowsEditionId                                        : Professional
WindowsProductName                                      : Windows 10 Pro
BiosFirmwareType                                        : Uefi
BiosManufacturer                                        : American Megatrends Inc.
BiosName                                                : 2702
CsCaption                                               : PEGASUS
CsDescription                                           : AT/AT COMPATIBLE
CsDNSHostName                                           : pegasus
CsManufacturer                                          : ASUS
CsModel                                                 : All Series
CsName                                                  : PEGASUS
CsNumberOfLogicalProcessors                             : 8
CsNumberOfProcessors                                    : 1
CsProcessors                                            : {Intel(R) Core(TM) i7-4790K CPU @ 4.00GHz}
CsTotalPhysicalMemory                                   : 17117261824
CsUserName                                              : PEGASUS\jc2po
OsName                                                  : Microsoft Windows 10 Pro
OsBootDevice                                            : \Device\HarddiskVolume2
OsSystemDevice                                          : \Device\HarddiskVolume4
OsSystemDrive                                           : C:
OsTotalVisibleMemorySize                                : 16716076
OsFreePhysicalMemory                                    : 7151152
OsTotalVirtualMemorySize                                : 19206444
OsFreeVirtualMemory                                     : 8142648
OsInUseVirtualMemory                                    : 11063796

PS C:\WINDOWS\system32> Get-CimInstance Win32_VideoController | Select-Object Name, AdapterRAM, DriverVersion, Status
Name                   AdapterRAM DriverVersion Status
----                   ---------- ------------- ------
NVIDIA GeForce GTX 980 4293918720 32.0.15.6094  OK

PS C:\WINDOWS\system32> Get-CimInstance Win32_LogicalDisk | Select-Object DeviceID, VolumeName, @{Name="Size(GB)"...}
DeviceID VolumeName   Size(GB) Free(GB)
-------- ----------   -------- --------
C:                      416.34    41.53
D:       docs          2794.39   763.94

PS C:\WINDOWS\system32> Get-PhysicalDisk | Select-Object FriendlyName, MediaType, OperationalStatus...
FriendlyName             MediaType OperationalStatus Size(GB)
------------             --------- ----------------- --------
ST3000DM001-1ER166       HDD       OK                 2794.52
Samsung SSD 840 PRO Seri SSD       OK                  476.94
```
</details>