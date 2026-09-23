"use client"

import type { DisplayMovie } from "@/catalog/types"
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Grid,
  HStack,
  Heading,
  Input,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react"
import Image from "next/image"
import { useMemo, useState } from "react"
import { LuArrowUpRight, LuSearch } from "react-icons/lu"

type SortMode = "consensus" | "critics" | "audience" | "newest"

function safePosterUrl(poster?: string) {
  if (!poster) return null
  try {
    const url = new URL(poster)
    return url.protocol === "https:" && url.hostname === "image.tmdb.org" ? url.href : null
  } catch {
    return null
  }
}

function MovieCard({ movie, index }: { movie: DisplayMovie; index: number }) {
  const poster = safePosterUrl(movie.poster)
  const content = (
    <Box
      as="article"
      borderTop="1px solid"
      borderColor="whiteAlpha.300"
      pt="3"
      transition="transform 180ms ease, border-color 180ms ease"
      _hover={{ transform: "translateY(-4px)", borderColor: "#f34f2d" }}
    >
      <Flex justify="space-between" align="center" mb="3">
        <Text fontSize="xs" letterSpacing="0.22em" color="whiteAlpha.500">
          {String(index + 1).padStart(3, "0")}
        </Text>
        <LuArrowUpRight aria-hidden="true" />
      </Flex>

      <Box position="relative" aspectRatio="2 / 3" bg="#1b1b18" overflow="hidden">
        {poster ? (
          <Image
            src={poster}
            alt={`${movie.title} poster`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <Flex height="100%" align="center" justify="center" px="6" textAlign="center">
            <Text fontFamily="var(--font-display)" fontSize="2xl" color="whiteAlpha.500">
              {movie.title}
            </Text>
          </Flex>
        )}

        <Grid
          position="absolute"
          left="0"
          right="0"
          bottom="0"
          templateColumns="1fr 1fr"
          bg="rgba(10, 10, 8, 0.92)"
          backdropFilter="blur(12px)"
        >
          <Box px="3" py="2" borderRight="1px solid" borderColor="whiteAlpha.200">
            <Text fontSize="2xl" lineHeight="1" fontWeight="700">
              {movie.critics}
            </Text>
            <Text fontSize="2xs" letterSpacing="0.16em" color="whiteAlpha.600">
              CRITICS
            </Text>
          </Box>
          <Box px="3" py="2">
            <Text fontSize="2xl" lineHeight="1" fontWeight="700">
              {movie.audience}
            </Text>
            <Text fontSize="2xs" letterSpacing="0.16em" color="whiteAlpha.600">
              AUDIENCE
            </Text>
          </Box>
        </Grid>
      </Box>

      <Stack gap="1" mt="4">
        <Heading as="h2" fontFamily="var(--font-display)" fontSize="2xl" fontWeight="500">
          {movie.title}
        </Heading>
        <Text fontSize="sm" color="whiteAlpha.600">
          {movie.year}
          {movie.director ? ` · ${movie.director}` : ""}
        </Text>
        <HStack gap="2" mt="2" flexWrap="wrap">
          {movie.genres.slice(0, 2).map((genre) => (
            <Badge
              key={genre}
              variant="outline"
              color="whiteAlpha.700"
              borderColor="whiteAlpha.300"
            >
              {genre}
            </Badge>
          ))}
        </HStack>
      </Stack>
    </Box>
  )

  return movie.rtUrl ? (
    <Box asChild>
      <a href={movie.rtUrl} target="_blank" rel="noreferrer" aria-label={`View ${movie.title}`}>
        {content}
      </a>
    </Box>
  ) : (
    content
  )
}

export function MovieExplorer({
  initialMovies,
  refreshedAt,
}: {
  initialMovies: DisplayMovie[]
  refreshedAt?: string
}) {
  const [query, setQuery] = useState("")
  const [genre, setGenre] = useState("All")
  const [sort, setSort] = useState<SortMode>("consensus")
  const [visibleCount, setVisibleCount] = useState(40)

  const genres = useMemo(
    () => ["All", ...new Set(initialMovies.flatMap((movie) => movie.genres))].slice(0, 12),
    [initialMovies]
  )

  const movies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = initialMovies.filter((movie) => {
      const matchesQuery =
        !normalizedQuery ||
        movie.title.toLowerCase().includes(normalizedQuery) ||
        movie.director?.toLowerCase().includes(normalizedQuery)
      const matchesGenre = genre === "All" || movie.genres.includes(genre)
      return matchesQuery && matchesGenre
    })

    return [...filtered].sort((a, b) => {
      if (sort === "critics") return b.critics - a.critics
      if (sort === "audience") return b.audience - a.audience
      if (sort === "newest") return b.year - a.year
      return Math.min(b.critics, b.audience) - Math.min(a.critics, a.audience)
    })
  }, [genre, initialMovies, query, sort])

  return (
    <Box
      as="main"
      id="catalog"
      bg="#0e0e0c"
      color="#f4f0e7"
      minH="100vh"
      py={{ base: "12", md: "20" }}
    >
      <Container maxW="1440px" px={{ base: "5", md: "10" }}>
        <Flex
          direction={{ base: "column", lg: "row" }}
          justify="space-between"
          align={{ base: "stretch", lg: "end" }}
          gap="10"
          mb="12"
        >
          <Box maxW="780px">
            <Text color="#f34f2d" fontSize="xs" letterSpacing="0.24em" mb="4">
              THE DOUBLE-FRESH INDEX
            </Text>
            <Heading
              as="h1"
              fontFamily="var(--font-display)"
              fontWeight="500"
              fontSize={{ base: "5xl", md: "7xl", lg: "8xl" }}
              lineHeight="0.88"
              letterSpacing="-0.045em"
            >
              Loved by both sides.
            </Heading>
          </Box>
          <Stack gap="1" color="whiteAlpha.600" fontSize="sm" minW="210px">
            <Text>{initialMovies.length} qualifying films</Text>
            <Text>
              {refreshedAt
                ? `Scores refreshed ${new Date(refreshedAt).toLocaleDateString()}`
                : "Waiting for the first catalog refresh"}
            </Text>
          </Stack>
        </Flex>

        <Flex
          direction={{ base: "column", lg: "row" }}
          gap="5"
          justify="space-between"
          borderY="1px solid"
          borderColor="whiteAlpha.300"
          py="5"
          mb="10"
        >
          <Flex position="relative" maxW={{ lg: "420px" }} flex="1" align="center">
            <Box position="absolute" left="3" color="whiteAlpha.500" zIndex="1">
              <LuSearch aria-hidden="true" />
            </Box>
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setVisibleCount(40)
              }}
              aria-label="Search movies or directors"
              placeholder="Search title or director"
              pl="10"
              borderColor="whiteAlpha.300"
              bg="transparent"
            />
          </Flex>

          <Flex gap="2" flexWrap="wrap">
            {genres.slice(0, 6).map((item) => (
              <Button
                key={item}
                size="sm"
                variant={genre === item ? "solid" : "outline"}
                bg={genre === item ? "#f34f2d" : "transparent"}
                color={genre === item ? "#0e0e0c" : "whiteAlpha.700"}
                borderColor="whiteAlpha.300"
                onClick={() => {
                  setGenre(item)
                  setVisibleCount(40)
                }}
              >
                {item}
              </Button>
            ))}
          </Flex>

          <NativeSelect.Root maxW={{ lg: "210px" }}>
            <NativeSelect.Field
              aria-label="Sort catalog"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortMode)}
              bg="#0e0e0c"
              borderColor="whiteAlpha.300"
              color="whiteAlpha.800"
            >
              <option value="consensus">Highest consensus</option>
              <option value="critics">Critics first</option>
              <option value="audience">Audience first</option>
              <option value="newest">Newest first</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Flex>

        {movies.length ? (
          <>
            <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 5 }} gap={{ base: "5", md: "8" }}>
              {movies.slice(0, visibleCount).map((movie, index) => (
                <MovieCard key={movie.id} movie={movie} index={index} />
              ))}
            </SimpleGrid>
            {visibleCount < movies.length ? (
              <Flex justify="center" mt="14">
                <Button
                  variant="outline"
                  borderColor="whiteAlpha.400"
                  color="whiteAlpha.900"
                  onClick={() => setVisibleCount((count) => count + 40)}
                >
                  Show 40 more
                </Button>
              </Flex>
            ) : null}
          </>
        ) : (
          <Flex
            minH="42vh"
            border="1px solid"
            borderColor="whiteAlpha.200"
            align="center"
            justify="center"
            textAlign="center"
            px="6"
          >
            <Stack gap="3" maxW="480px">
              <Text fontFamily="var(--font-display)" fontSize="4xl">
                {initialMovies.length ? "No films match that cut." : "The catalog is warming up."}
              </Text>
              <Text color="whiteAlpha.600">
                {initialMovies.length
                  ? "Try a broader search or another genre."
                  : "The first successful refresh will publish the complete 90/90 list here."}
              </Text>
            </Stack>
          </Flex>
        )}
      </Container>
    </Box>
  )
}
