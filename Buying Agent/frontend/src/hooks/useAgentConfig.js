import { useState, useEffect } from 'react';
import { agentService } from '../services/agent.service';

export function useAgentConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await agentService.fetchConfig();
      setConfig(data);
    } catch (err) {
      console.warn('Failed to load agent config:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateApiKey = async (apiKey) => {
    const res = await agentService.updateApiKey(apiKey);
    await loadConfig();
    return res;
  };

  return {
    config,
    loading,
    updateApiKey,
    reloadConfig: loadConfig
  };
}
