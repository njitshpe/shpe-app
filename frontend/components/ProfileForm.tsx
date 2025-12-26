import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

const SHPE_COLORS = { 
  darkBlue: '#002855', 
  textGray: '#666666', 
  border: '#E0E0E0',
  error: '#D32F2F' 
};

interface ProfileFormProps {
  firstName: string;
  lastName: string;
  major: string;
  onChange: (field: string, value: string) => void;
}

export function ProfileForm({ firstName, lastName, major, onChange }: ProfileFormProps) {
  return (
    <View style={styles.container}>
      {/* FIRST NAME */}
      <View style={styles.rowLabel}>
        <Text style={styles.label}>First Name</Text>
        <Text style={styles.limit}>{firstName.length}/15</Text>
      </View>
      <TextInput 
        style={styles.input} 
        value={firstName} 
        onChangeText={(t) => onChange('firstName', t)} 
        placeholder="Enter first name"
        maxLength={15} // <--- LIMIT APPLIED HERE
      />
      
      {/* LAST NAME */}
      <View style={styles.rowLabel}>
        <Text style={styles.label}>Last Name</Text>
        <Text style={styles.limit}>{lastName.length}/15</Text>
      </View>
      <TextInput 
        style={styles.input} 
        value={lastName} 
        onChangeText={(t) => onChange('lastName', t)} 
        placeholder="Enter last name"
        maxLength={15} // <--- LIMIT APPLIED HERE
      />
      
      {/* MAJOR (No strict limit, but standard text input) */}
      <Text style={styles.label}>Major</Text>
      <TextInput 
        style={styles.input} 
        value={major} 
        onChangeText={(t) => onChange('major', t)} 
        placeholder="e.g. Computer Science"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    marginBottom: 20 
  },
  rowLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  label: { 
    fontSize: 14, 
    color: SHPE_COLORS.textGray, 
    marginBottom: 5 
  },
  limit: {
    fontSize: 12,
    color: '#999',
  },
  input: { 
    borderBottomWidth: 1, 
    borderBottomColor: SHPE_COLORS.border, 
    fontSize: 16, 
    color: SHPE_COLORS.darkBlue, 
    paddingVertical: 8 
  },
});