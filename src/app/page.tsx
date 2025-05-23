"use client";

import { Box, Container, Heading, Text, VStack } from "@chakra-ui/react";

export default function Home() {
	return (
		<Container maxW="container.xl" py={8}>
			<VStack gap={8} align="center">
				<Box textAlign="center">
					<Heading as="h1" size="3xl" mb={4}>
						NinetyNinety
					</Heading>
					<Text fontSize="xl" color="gray.600">
						Discover the absolute best films with both 90%+ critics and audience
						scores
					</Text>
				</Box>

				<Box textAlign="center" pt={8}>
					<Text fontSize="lg" color="gray.500">
						Coming soon...
					</Text>
				</Box>
			</VStack>
		</Container>
	);
}
