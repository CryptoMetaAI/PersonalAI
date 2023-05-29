import {
  Box,
  Center,
  Wrap, 
  WrapItem,
  Image,
  Button,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  VStack,
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import vipABI from './vip.json';
import { isEmptyObj } from '../../../../utils/utils.js';
import BigNumber from 'bignumber.js';

const LensVIP: FC = () => {
  const { account, library: web3, chainId } = useWeb3React();
  const [tokenList, setTokenList] = useState([]);
  const [vipContract, setVipContract] = useState(null);
  const [telegramId, setTelegramId] = useState('');
  const [months, setMonths] = useState(1);
  const [isOpenning, setIsOpenning] = useState(false);
  const [update, setUpdate] = useState(false);
  const [payedNFTId, setPayedNFTId] = useState(0);
  const [settingCard, setSettingCard] = useState({});

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const initialRef = React.useRef(null);

  const contractAddr = {
    5: {
      vipAddr: '0xB1Ec0390FBDa093A5660Ff64C8FBD1a6F3D2C31C'
    },
    137: {
      vipAddr: '',
    },
    80001: {
      vipAddr: '',
    },
  };

  useEffect(() => {
    const index = window.location.search.indexOf('tid=');
    if (index > -1) {
        const tid = window.location.search.substring(index + 'tid='.length);
        localStorage.setItem('telegramId', tid);
        setTelegramId(tid);
    } else {
      const tid = localStorage.getItem('telegramId');
      if (tid != null) {
        setTelegramId(tid);
      }
    }
  }, []);

  useEffect(() => {
    if (web3 === undefined || web3 == null) {
      return;
    }

    const vipAddr = contractAddr[chainId].vipAddr;
    const vipContractObj = new web3.eth.Contract(vipABI, vipAddr);
    setVipContract(vipContractObj);
  }, [web3]);

  useEffect(() => {
    if (vipContract === undefined || vipContract == null) {
      return;
    }
    const tokenURIList: any[] = []
    let contractFunc = vipContract.methods['balanceOf'];
    contractFunc(account).call({ from: account }).then((balance: number) => {
      console.log('number of your NFTs', balance);
      contractFunc = vipContract.methods['tokenOfOwnerByIndex'];
      for (let i = 0; i < balance; i++) {
        contractFunc(account, i).call({ from: account }).then((tokenId: number) => {
          contractFunc = vipContract.methods['tokenURI'];
          contractFunc(tokenId).call({from: account}).then((tokenURI: string) => {
            tokenURIList.push({tokenId, tokenURI});
            if (tokenURIList.length == balance) {
              tokenURIList.sort((a, b) => a.tokenId - b.tokenId)
              setTokenList(tokenURIList);
              console.log(tokenURIList)
            }
          })
        });
      }
    })
  }, [vipContract, update]);

  useEffect(() => {
    if (vipContract === undefined || vipContract == null) return;
    let contractFunc = vipContract.methods['userPayedNFT'];
    contractFunc(account).call({ from: account }).then(tokenId => {
      console.log('userPayedNFT', tokenId);
      setPayedNFTId(tokenId);
    })
  }, [vipContract, update]);

  const mintCard = () => {
    if (telegramId.length == 0 || months == 0) {
      toast({
        title: 'Failed',
        description: 'Please input the corrent value',
        status: 'error',
        position: 'bottom-right',
        isClosable: true,
      });
      return;
    }
    const contractFunc = vipContract.methods['mintCard'];
    const telegramIdBytes = '' + telegramId;
    const data = contractFunc(telegramIdBytes, months).encodeABI();
    const fee = '0x' + new BigNumber(1).shiftedBy(15).multipliedBy(months).toString(16);
    console.log(fee, months);
    const tx = {
      from: account,
      to: vipContract._address,
      data,
      value: fee,
      gasLimit: 0,
    };
    contractFunc(telegramIdBytes, months)
      .estimateGas({ from: account, value: fee })
      .then((gasLimit) => {
        tx.gasLimit = gasLimit;
        web3.eth
          .sendTransaction(tx)
          .on('transactionHash', () => {
            setIsOpenning(true);
          })
          .on('receipt', () => {
            setIsOpenning(false);
            setUpdate(!update);
            onClose();
          })
          .on('error', () => {
            setIsOpenning(false);
            toast({
              title: 'Failed',
              description: 'Open card failed',
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
      });
  };

  const enablePayedCard = (tokenId) => {
    setSettingCard({});
    const contractFunc = vipContract.methods['setPayedCard'];
    const data = contractFunc(tokenId).encodeABI();
    const tx = {
      from: account,
      to: vipContract._address,
      data,
      gasLimit: 0,
    };
    contractFunc(tokenId)
      .estimateGas({ from: account })
      .then((gasLimit) => {
        tx.gasLimit = gasLimit;
        web3.eth
          .sendTransaction(tx)
          .on('transactionHash', () => {
            const obj = {}
            obj[tokenId] = true;
            setSettingCard(obj);
          })
          .on('receipt', () => {
            const obj = {}
            obj[tokenId] = false;
            setSettingCard(obj);
            setUpdate(!update);
          })
          .on('error', () => {
            const obj = {}
            obj[tokenId] = false;
            setSettingCard(obj);
            toast({
              title: 'Failed',
              description: 'Set payed card failed',
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
      });
  };

  const disablePayedCard = (tokenId) => {
    setSettingCard({});
    const contractFunc = vipContract.methods['cancelPayedCard'];
    const data = contractFunc().encodeABI();
    const tx = {
      from: account,
      to: vipContract._address,
      data,
      gasLimit: 0,
    };
    contractFunc()
      .estimateGas({ from: account })
      .then((gasLimit) => {
        tx.gasLimit = gasLimit;
        web3.eth
          .sendTransaction(tx)
          .on('transactionHash', () => {
            const obj = {}
            obj[tokenId] = true;
            setSettingCard(obj);
          })
          .on('receipt', () => {
            const obj = {}
            obj[tokenId] = false;
            setSettingCard(obj);
            setUpdate(!update);
          })
          .on('error', () => {
            const obj = {}
            obj[tokenId] = false;
            setSettingCard(obj);
            toast({
              title: 'Failed',
              description: 'Open card failed',
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
      });
  };

  return (
    <>
      <Box>
        <Center height="10vh">
          <Button colorScheme="teal" variant="outline" onClick={() => onOpen()}>
            Open Card
          </Button>
        </Center>
      </Box>
      <Wrap>
        {
          tokenList.map(tokenInfo => 
            <WrapItem>
              <VStack justify='center'>
                <Image src={JSON.parse(atob(tokenInfo.tokenURI.substring('data:application/json;base64,'.length))).image} w='400px'></Image>
                <Button onClick={tokenInfo.tokenId != payedNFTId ? () => enablePayedCard(tokenInfo.tokenId) : () => disablePayedCard(tokenInfo.tokenId)} 
                        style={{marginTop:'-220px', marginLeft: '80px'}}
                        isLoading={settingCard[tokenInfo.tokenId]}
                        loadingText={tokenInfo.tokenId == payedNFTId ? 'Disabling' : 'Enabling'}>
                          {tokenInfo.tokenId == payedNFTId ? 'Disable' : 'Enable'} Payed Card [id = {tokenInfo.tokenId}]
                </Button>
              </VStack>
            </WrapItem>
            )
        }
      </Wrap>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Open Card</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Telegram Id</FormLabel>
              <Input disabled={true}
                ref={initialRef}
                errorBorderColor="red.300"
                onChange={(e) => (isEmptyObj(e.target.value) ? setTelegramId('') : setTelegramId(e.target.value))}
                value={telegramId}
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Months (0.001 Ether/Month)</FormLabel>
              <Input onChange={(e) => setMonths(parseInt(e.target.value))} value={months} />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={mintCard} isLoading={isOpenning} loadingText="Openning">
              Open Card
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default LensVIP;
