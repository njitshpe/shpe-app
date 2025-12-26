import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const SHPE_COLORS = { 
  darkBlue: '#002855', 
  lightBlue: '#00A3E0', 
  white: '#FFFFFF', 
  gray: '#F4F4F4' 
};

interface ResumeUploaderProps {
  resumeName: string | null;
  onUpload: () => void;
}

export function ResumeUploader({ resumeName, onUpload }: ResumeUploaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Resume</Text>
      <View style={styles.uploadBox}>
        <Text style={styles.fileName} numberOfLines={1}>
          {resumeName || 'No resume uploaded'}
        </Text>
        <TouchableOpacity style={styles.button} onPress={onUpload}>
          <Text style={styles.buttonText}>
            {resumeName ? 'Replace PDF' : 'Upload PDF'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    marginBottom: 20 
  },
  label: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: SHPE_COLORS.darkBlue, 
    marginBottom: 10 
  },
  uploadBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: SHPE_COLORS.gray, 
    padding: 15, 
    borderRadius: 10 
  },
  fileName: { 
    color: '#666', 
    flex: 1, 
    marginRight: 10 
  },
  button: { 
    backgroundColor: SHPE_COLORS.lightBlue, 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 6 
  },
  buttonText: { 
    color: SHPE_COLORS.white, 
    fontWeight: '600' 
  },
});