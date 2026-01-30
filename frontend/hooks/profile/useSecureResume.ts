import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useSecureResume(resumePath: string | null) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If no path is saved in the DB, stop here.
    if (!resumePath) {
        setSignedUrl(null);
        return;
    }

    // If it's an old legacy HTTP link, just pass it through.
    if (resumePath.startsWith('http')) {
        setSignedUrl(resumePath);
        return;
    }

    const fetchSignedUrl = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.storage
          .from('resumes')
          .createSignedUrl(resumePath, 3600); // Valid for 1 hour

        if (error) {
            // If the file is missing, don't crash the app. Just log it and show nothing.
            console.log("Resume file missing from bucket:", error.message);
            setSignedUrl(null);
        } else if (data) {
            setSignedUrl(data.signedUrl);
        }
      } catch (err) {
        console.error("Unexpected error signing URL:", err);
        setSignedUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSignedUrl();
  }, [resumePath]);

  return { signedUrl, loading };
}