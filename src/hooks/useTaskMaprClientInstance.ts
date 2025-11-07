import { useMemo } from 'react';

import { createTaskMaprClient } from '../lib/createTaskMaprClient';
import { TaskMaprClient, TaskMaprClientOptions } from '../types';

export interface UseTaskMaprClientInstanceOptions {
  agentEndpoint?: string;
  actionHandlers?: TaskMaprClientOptions['actionHandlers'];
  options?: Omit<TaskMaprClientOptions, 'actionHandlers'> & Pick<Partial<TaskMaprClientOptions>, 'actionHandlers'>;
  extraDependencies?: ReadonlyArray<unknown>;
}

export interface UseTaskMaprClientInstanceResult {
  client: TaskMaprClient;
  Overlay: TaskMaprClient['Overlay'];
}

/**
 * Convenience hook that memoizes the TaskMapr client so app code doesn't need
 * to wrap createTaskMaprClient in useMemo. Pass any additional dependencies
 * that should force the client to refresh (e.g. actionHandlers).
 */
export function useTaskMaprClientInstance(
  {
    agentEndpoint = '',
    actionHandlers,
    options,
    extraDependencies,
  }: UseTaskMaprClientInstanceOptions = {}
): UseTaskMaprClientInstanceResult {
  const mergedOptions = useMemo<TaskMaprClientOptions>(
    () => {
      if (
        options?.actionHandlers &&
        actionHandlers &&
        options.actionHandlers !== actionHandlers
      ) {
        console.warn(
          '[TaskMapr] useTaskMaprClientInstance: Received different actionHandlers in options and top-level argument. Using the top-level actionHandlers.'
        );
      }

      return {
        ...(options ?? {}),
        ...(actionHandlers ? { actionHandlers } : {}),
      } as TaskMaprClientOptions;
    },
    [options, actionHandlers],
  );

  const client = useMemo(
    () => createTaskMaprClient(agentEndpoint, mergedOptions),
    [agentEndpoint, mergedOptions, ...(extraDependencies ?? [])],
  );

  return useMemo(
    () => ({
      client,
      Overlay: client.Overlay,
    }),
    [client],
  );
}


