import { Button, Text, HStack, Tooltip } from '@chakra-ui/react';
import { getEllipsisTxt } from 'utils/format';
import React from 'react';
import { InjectedConnector } from '@web3-react/injected-connector';
import { useWeb3React } from '@web3-react/core';

const ConnectButton = () => {
  const { active, account, activate, deactivate } = useWeb3React();

  const injected = new InjectedConnector({
    supportedChainIds: [5, 137, 80001],
  });

  async function connect() {
    try {
      console.log('connect');
      await activate(injected);
    } catch (ex) {
      console.log(ex);
    }
  }

  async function disconnect() {
    try {
      deactivate();
    } catch (ex) {
      console.log(ex);
    }
  }

  function wallet() {
    if (active) {
      disconnect();
    } else {
      connect();
    }
  }

  if (active) {
    return (
      <HStack onClick={disconnect} cursor={'pointer'}>
        <Text fontWeight="medium">{getEllipsisTxt(account as string)}</Text>
      </HStack>
    );
  }

  return (
    <Tooltip label={'Current supported network: Arbitrum-One/Nova, Optimism and BSC-Testnet.'}>
      <Button onClick={() => wallet()} colorScheme="teal" variant="outline">
        Connect Wallet
      </Button>
    </Tooltip>
  );
};

export default ConnectButton;
