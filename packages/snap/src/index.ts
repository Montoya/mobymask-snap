import { OnTransactionHandler } from '@metamask/snap-types';
import { heading, panel, text } from '@metamask/snaps-ui';
import { getInsights } from './insights';

/**
 * Handle an incoming transaction, and return any insights.
 *
 * @param args - The request handler args as object.
 * @param args.transaction - The transaction object.
 * @returns The transaction insights.
 */
export const onTransaction: OnTransactionHandler = async ({ transaction }) => {
  const insights = await getInsights(transaction);
  const titles = Object.keys(insights);
  const arr = [];
  for (let i = 0; i < titles.length; i++) {
    arr.push(heading(titles[i]));
    arr.push(text(insights[titles[i]]));
  }

  return {
    content: panel(arr),
  };
};
