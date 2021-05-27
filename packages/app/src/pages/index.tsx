import {
  Container,
  Heading,
  VStack,
  Stack,
  Text,
  Code,
  OrderedList,
  ListItem,
  Link,
  Button,
  Slider,
  SliderThumb,
  SliderTrack,
  SliderFilledTrack,
  Switch,
  Avatar,
  Flex,
  Badge,
  Box,
  Divider,
} from '@chakra-ui/react'

function Home() {
  return (
    <Container>
      <VStack my={24} spacing={12}>
        <Heading as="h1" fontSize="9xl" textAlign="center">
          Saltana
        </Heading>
        <Text fontSize="3xl" textAlign="center">
          Welcome to the Saltana application.
        </Text>
        <Text>
        This page is normally loaded from somewhere else.
        </Text></VStack>
    </Container>
  )
}

export default Home
