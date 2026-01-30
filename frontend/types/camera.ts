export interface CameraPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export interface ScannerConfig {
  enableTorch?: boolean;
  scanInterval?: number;  // Minimum ms between scans
  validationPattern?: RegExp;  // Pattern to validate scanned data
}
