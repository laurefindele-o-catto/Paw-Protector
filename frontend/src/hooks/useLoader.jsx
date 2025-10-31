import { useState } from "react";

export function useLoader(asyncFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async (...args) => {
    setLoading(true);
    setError(null);
    try {
      return await asyncFn(...args);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { run, loading, error };
}