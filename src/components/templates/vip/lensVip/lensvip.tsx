import {
  Box,
  Flex,
  Text,
  Circle,
  Stack,
  Divider,
  Collapse,
  Center,
  Link,
  Textarea,
  Image,
  Button,
  HStack,
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
} from '@chakra-ui/react';
import { ChevronUpIcon, ChevronDownIcon, ExternalLinkIcon, CopyIcon } from '@chakra-ui/icons';
import React, { FC, useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import lensHubABI from './lensHub.json';
import vipABI from './vip.json';
import { isEmptyObj } from '../../../../utils/utils.js';
import BigNumber from 'bignumber.js';

const LensVIP: FC = () => {
  const { account, library: web3, chainId } = useWeb3React();
  const [isOpen1, setIsOpen1] = useState(true);
  const [isOpen2, setIsOpen2] = useState(true);
  const [signature, setSignature] = useState('');
  const [kolList, setKolList] = useState([]);
  const [kolProfileList, setKolProfileList] = useState([]);
  const [myProfileList, setMyProfileList] = useState([]);
  const [selectedKOLProfile, setSelectedKOLProfile] = useState(null);
  const [selectedMyProfile, setSelectedMyProfile] = useState(null);
  const [vipContract, setVipContract] = useState(null);
  const [isBindingTelegram, setIsBindingTelegram] = useState(false);
  const [telegramId, setTelegramId] = useState('');
  const [months, setMonths] = useState(1);
  const [isOpenning, setIsOpenning] = useState(false);
  const [kolProfileId, setKolProfileId] = useState(0);

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const initialRef = React.useRef(null);

  const KOLProfileIdList = [20000, 21000, 23000];
  const ipfsGateway = 'https://cloudflare-ipfs.com/ipfs/';
  const contractAddr = {
    137: {
      vipAddr: '',
      lensHubAddr: '0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d',
    },
    80001: {
      vipAddr: '0x3d1a3Fe1c3D313b6c78fB5137496E48724733C44',
      lensHubAddr: '0x6346fAF83b9Eaaa8E34d5428f3294AC53B6bF50E',
    },
  };

  useEffect(() => {
    if (web3 === undefined) return;

    const vipAddr = contractAddr[chainId].vipAddr;
    const vipContractObj = new web3.eth.Contract(vipABI, vipAddr);
    setVipContract(vipContractObj);
  }, [web3]);

  useEffect(() => {
    if (web3 === undefined || isEmptyObj(vipContract)) return;

    vipContract.methods
      .getKolLength()
      .call()
      .then((result) => {
        vipContract.methods
          .getKols(0, result)
          .call()
          .then((result) => {
            console.log('getKols', result);
            setKolProfileList(result);
          });
      });
  }, [web3, vipContract]);

  useEffect(() => {
    if (web3 === undefined || kolProfileList.length == 0) return;

    const lensHubAddr = contractAddr[chainId].lensHubAddr;
    const lensHubContract = new web3.eth.Contract(lensHubABI, lensHubAddr);
    const kols = [];
    kolProfileList.forEach((profileId) => {
      lensHubContract.methods
        .tokenURI(profileId)
        .call()
        .then((result) => {
          result = JSON.parse(atob(result.substr('data:application/json;base64,'.length)));
          result.profileId = profileId;
          kols.push(result);
          if (kols.length == KOLProfileIdList.length) {
            console.log(kols);
            setKolList(kols);
          }
        });
    });
  }, [web3, kolProfileList]);

  const bindTelegram = () => {
    if (isEmptyObj(signature)) {
      toast({
        title: 'Failed',
        description: 'Please get the signature from chatbot firstly.',
        status: 'error',
        position: 'bottom-right',
        isClosable: true,
      });
      return;
    }
    const signInfo = JSON.parse(signature);
    setTelegramId(signInfo.telegramId);
    const contractFunc = vipContract.methods['bindTelegramAndUser'];
    const data = contractFunc(signInfo.telegramId, signInfo.v, signInfo.r, signInfo.s).encodeABI();
    const tx = {
      from: account,
      to: vipContract._address,
      data,
      value: 0,
      gasLimit: 0,
    };
    contractFunc(signInfo.telegramId, signInfo.v, signInfo.r, signInfo.s)
      .estimateGas({ from: account })
      .then((gasLimit: any) => {
        tx.gasLimit = gasLimit;
        web3.eth
          .sendTransaction(tx)
          .on('transactionHash', () => {
            setIsBindingTelegram(true);
          })
          .on('receipt', () => {
            setIsBindingTelegram(false);
          })
          .on('error', () => {
            setIsBindingTelegram(false);
            toast({
              title: 'Failed',
              description: 'Bind telegram failed',
              status: 'error',
              position: 'bottom-right',
              isClosable: true,
            });
          });
      });
  };

  const openCard = () => {
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
    const contractFunc = vipContract.methods['openCard'];
    const data = contractFunc(telegramId, months, kolProfileId).encodeABI();
    const fee = '0x' + new BigNumber(1).shiftedBy(15).multipliedBy(months).toString(16);
    console.log(fee, months, kolProfileId);
    const tx = {
      from: account,
      to: vipContract._address,
      data,
      value: fee,
      gasLimit: 0,
    };
    contractFunc(telegramId, months, kolProfileId)
      .estimateGas({ from: account, value: fee })
      .then((gasLimit: any) => {
        tx.gasLimit = gasLimit;
        web3.eth
          .sendTransaction(tx)
          .on('transactionHash', () => {
            setIsOpenning(true);
          })
          .on('receipt', () => {
            setIsOpenning(false);
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

  return (
    <>
      <Box>
        <Center height="100vh">
          <Box w="80%" maxW="800px">
            <Flex direction="row" align="center" mb={4}>
              <Circle size={8} bg="green.500" color="white" mr={4}>
                1
              </Circle>
              <Text fontWeight="bold">Register Your Telegram</Text>
              <Box ml="auto">
                <ChevronUpIcon color="gray.300" _hover={{ color: 'gray.500' }} onClick={() => setIsOpen1(!isOpen1)} />
                <ChevronDownIcon color="gray.300" _hover={{ color: 'gray.500' }} onClick={() => setIsOpen1(!isOpen1)} />
              </Box>
            </Flex>
            <Collapse in={isOpen1} animateOpacity>
              <Stack spacing={4} mb={4}>
                <Box>
                  <Text fontWeight="bold">Task 1.1</Text>
                  <Text>
                    Open GPT Chatbot
                    <Link href={'https://t.me/Web3ChatGPTBot'} isExternal alignItems={'center'}>
                      <ExternalLinkIcon />
                    </Link>
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Task 1.2</Text>
                  <Text>Copy and send the message marked as yellow to bot in your telegram:</Text>
                  <HStack>
                    <Text as="mark">/verify {account}</Text>
                    <CopyIcon
                      color="gray.300"
                      _hover={{ color: 'gray.500' }}
                      onClick={() =>
                        navigator.clipboard
                          .writeText('/verify ' + account)
                          .then(() => toast({ description: 'Copied successfully' }))
                      }
                    />
                  </HStack>
                </Box>
                <Box>
                  <Text fontWeight="bold">Task 1.3</Text>
                  <Text>Copy the response of the bot in 1.2, and paste it here:</Text>
                  <Textarea size="md" onChange={(e) => setSignature(e.target.value)} />
                </Box>
                <Box>
                  <Button
                    colorScheme="teal"
                    variant="outline"
                    onClick={() => bindTelegram()}
                    isLoading={isBindingTelegram}
                    loadingText="Binding"
                  >
                    Bind Telegram
                  </Button>
                </Box>
              </Stack>
            </Collapse>
            <Divider />
            <Flex direction="row" align="center" mt={4}>
              <Circle size={8} bg="red.500" color="white" mr={4}>
                2
              </Circle>
              <Text fontWeight="bold">Open VIP Card</Text>
              <Box ml="auto">
                <ChevronUpIcon color="gray.300" _hover={{ color: 'gray.500' }} onClick={() => setIsOpen2(!isOpen2)} />
                <ChevronDownIcon color="gray.300" _hover={{ color: 'gray.500' }} onClick={() => setIsOpen2(!isOpen2)} />
              </Box>
            </Flex>
            <Collapse in={isOpen2} animateOpacity>
              <Stack spacing={4} mt={4}>
                <Box>
                  <Text fontWeight="bold">Task 2.1 (Optional)</Text>
                  <Text>Select one KOL who you follow (KOL can bring you discount benefits.):</Text>
                  <Flex flexWrap={'wrap'} gap={6}>
                    {kolList.map((kolInfo) => (
                      <Image
                        width={150}
                        height={150}
                        border={selectedKOLProfile === kolInfo.profileId ? '2px solid red' : 'none'}
                        src={kolInfo.image}
                        onClick={() => setSelectedKOLProfile(kolInfo.profileId)}
                      />
                    ))}
                  </Flex>
                </Box>
                <Box>
                  <Text fontWeight="bold">Task 2.2</Text>
                  <Button colorScheme="teal" variant="outline" onClick={() => onOpen()}>
                    Open Card
                  </Button>
                </Box>
              </Stack>
            </Collapse>
          </Box>
        </Center>
      </Box>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Open Card</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Telegram Id</FormLabel>
              <Input
                ref={initialRef}
                errorBorderColor="red.300"
                onChange={(e) => (isEmptyObj(e.target.value) ? setTelegramId('') : setTelegramId(e.target.value))}
                value={telegramId}
              />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Months (0.001 Matic/Month)</FormLabel>
              <Input onChange={(e) => setMonths(parseInt(e.target.value))} value={months} />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Select KOL Profile Id (Optional)</FormLabel>
              <Input onChange={(e) => setKolProfileId(parseInt(e.target.value))} value={kolProfileId} />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={openCard} isLoading={isOpenning} loadingText="Openning">
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
