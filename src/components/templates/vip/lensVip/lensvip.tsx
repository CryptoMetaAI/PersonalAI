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
} from '@chakra-ui/react';
import { ChevronUpIcon, ChevronDownIcon, ExternalLinkIcon, CopyIcon } from '@chakra-ui/icons';
import React, { FC, useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import lensHubABI from './lensHub.json';

const LensVIP: FC = () => {
  const { account, library: web3, chainId } = useWeb3React();
  const [isOpen1, setIsOpen1] = useState(true);
  const [isOpen2, setIsOpen2] = useState(true);
  const [signature, setSignature] = useState('');
  const [kolList, setKolList] = useState([]);
  const [myProfileList, setMyProfileList] = useState([]);
  const [selectedKOLProfile, setSelectedKOLProfile] = useState(null);
  const [selectedMyProfile, setSelectedMyProfile] = useState(null);
  const [vipContract, setVipContract] = useState(null);

  const toast = useToast();

  const KOLProfileIdList = [20000, 21000, 23000];
  const ipfsGateway = 'https://cloudflare-ipfs.com/ipfs/';
  const contractAddr = {
    137: {
      vipAddr: '',
      lensHubAddr: '0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d',
    },
    80001: {
      vipAddr: '',
      lensHubAddr: '0x60Ae865ee4C725cd04353b5AAb364553f56ceF82',
    },
  };

  useEffect(() => {
    if (web3 === undefined) return;

    const vipAddr = contractAddr[chainId].vipAddr;
    setVipContract(new web3.eth.Contract(lensHubABI, vipAddr));

    const lensHubAddr = contractAddr[chainId].lensHubAddr;
    const lensHubContract = new web3.eth.Contract(lensHubABI, lensHubAddr);
    const kols = [];
    KOLProfileIdList.forEach((profileId) => {
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
    lensHubContract.methods
      .balanceOf(account)
      .call()
      .then((result) => {
        console.log('all tokens num', result);
        const myProfiles = [];
        for (let i = 0; i < result; i++) {
          lensHubContract.methods
            .tokenOfOwnerByIndex(account, i)
            .call()
            .then((profileId) => {
              lensHubContract.methods
                .tokenURI(profileId)
                .call()
                .then((profileInfo) => {
                  profileInfo = JSON.parse(atob(profileInfo.substr('data:application/json;base64,'.length)));
                  profileInfo.profileId = profileId;
                  myProfiles.push(profileInfo);
                  if (myProfiles.length == result) {
                    console.log(myProfiles);
                    setMyProfileList(myProfiles);
                  }
                });
            });
        }
      });
  }, [web3]);

  const registerTelegram = () => {};

  const openCard = () => {};

  return (
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
                  Open GPTChat Bot：
                  <Link href={'https://t.me/Web3ChatGPTBot'} isExternal alignItems={'center'}>
                    GPTChat Bot <ExternalLinkIcon />
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
                <Button colorScheme="teal" variant="outline" onClick={() => registerTelegram()}>
                  Register Telegram
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
                <Button colorScheme="teal" variant="outline" onClick={() => openCard()}>
                  Open Card
                </Button>
              </Box>
            </Stack>
          </Collapse>
        </Box>
      </Center>
    </Box>
  );
};

export default LensVIP;
