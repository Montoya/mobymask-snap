import { remove0x, add0x } from '@metamask/utils';
import { decode } from '@metamask/abi-utils';
import { ethers } from 'ethers';

/**
 * As an example, get transaction insights by looking at the transaction data
 * and attempting to decode it.
 *
 * @param transaction - The transaction to get insights for.
 * @returns The transaction insights.
 */
export async function getInsights(transaction: Record<string, unknown>) {
  const mobyMaskAddress = '0xD07Ed0eB708Cb7A660D22f2Ddf7b8C19c7bf1F69';

  const hexChainId = await ethereum.request({ method: 'eth_chainId' });
  const chainId = parseInt(`${hexChainId}`, 16);

  const returnObject: Record<string, any> = {};

  try {
    // Check if the transaction has data.
    if (chainId !== 1) {
      returnObject.Notice = 'Insights are only available for Ethereum mainnet.';
      throw 'Not on Ethereum mainnet.';
    }

    const mobyMaskABI = [
      {
        inputs: [
          { internalType: 'string', name: 'identifier', type: 'string' },
          { internalType: 'bool', name: 'isNominated', type: 'bool' },
        ],
        name: 'claimIfMember',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          { internalType: 'string', name: 'identifier', type: 'string' },
          { internalType: 'bool', name: 'isAccused', type: 'bool' },
        ],
        name: 'claimIfPhisher',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [{ internalType: 'string', name: '', type: 'string' }],
        name: 'isMember',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [{ internalType: 'string', name: '', type: 'string' }],
        name: 'isPhisher',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
      },
    ];

    const provider = new ethers.providers.Web3Provider(ethereum);

    const mobyMaskContract = new ethers.Contract(
      mobyMaskAddress,
      mobyMaskABI,
      provider,
    );

    let ethersReadResult = false;

    if (
      transaction.to === mobyMaskAddress.toLowerCase() &&
      typeof transaction.data === 'string'
    ) {
      // User is interacting with MobyMask contract

      returnObject.Hello =
        '🐋 You are interacting with the MobyMask Phisher Registry.';

      const transactionData = remove0x(transaction.data);

      const functionSignature = transactionData.slice(0, 8);

      if (
        functionSignature === '6b6dc9de' ||
        functionSignature === '463a3ce4'
      ) {
        // User is calling "claimIfPhisher" or "claimIfMember"

        const parameterTypes = ['string', 'bool'];

        const decodedParameters = decode(
          parameterTypes,
          add0x(transactionData.slice(8)),
        );

        if (functionSignature === '6b6dc9de') {
          ethersReadResult = await mobyMaskContract.isPhisher(
            decodedParameters[0],
          );

          if (decodedParameters[1]) {
            if (ethersReadResult) {
              returnObject.Notice =
                '✅ This phisher has already been reported.';
            } else {
              returnObject.Notice =
                '💡 You are reporting a phisher. Thank you for helping to keep the web safe!';
            }
          } else if (ethersReadResult) {
            returnObject.Notice = '💡 You are revoking phisher status.';
          } else {
            returnObject.Notice =
              '🤔 This has not been reported in the registry or is already revoked.';
          }
        } else {
          ethersReadResult = await mobyMaskContract.isMember(
            decodedParameters[0],
          );

          if (decodedParameters[1]) {
            if (ethersReadResult) {
              returnObject.Notice = '✅ This user is already a member.';
            } else {
              returnObject.Notice =
                '🤝 You are inviting a new member to help keep the web safe.';
            }
          } else if (ethersReadResult) {
            returnObject.Notice = '💡 You are revoking member status.';
          } else {
            returnObject.Notice =
              '🤔 This user is not a member or their status has already been revoked.';
          }
        }
      }
    } else {
      // Check if the user is interacting with a phisher
      ethersReadResult = await mobyMaskContract.isPhisher(
        `eip155:1:${transaction.to}`,
      );

      if (ethersReadResult) {
        returnObject.Beware =
          '😱 This address has been reported for phishing in the MobyMask Phisher Registry. You should not interact with this address.';
      } else {
        returnObject.Notice =
          '🤔 This address has not been reported in the MobyMask Phisher Registry. This does not guarantee that it is safe to interact with. Proceed with care.';
      }
    }
  } catch (error) {
    console.error(error);
  }

  return returnObject;
}
