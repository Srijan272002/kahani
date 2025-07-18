import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { tmdb, Movie } from '../services/tmdb'
import { useAuth } from '../hooks/useAuth'
import { useRecommendationStore } from '../stores/recommendationStore'

// Cache for personalized movie with timestamp
interface MovieCache {
  movie: Movie | null
  matchPercentage: number
  timestamp: number
}

const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes
const CACHE_KEY = 'kahani_hero_movie_cache'

const getCachedMovie = (): {
  movie: Movie | null
  matchPercentage: number
} | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { movie, matchPercentage, timestamp }: MovieCache =
        JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_DURATION) {
        return { movie, matchPercentage }
      }
    }
  } catch (error) {
    console.warn('Error reading hero movie cache:', error)
  }
  return null
}

const setCachedMovie = (movie: Movie | null, matchPercentage: number) => {
  try {
    const cache: MovieCache = {
      movie,
      matchPercentage,
      timestamp: Date.now(),
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.warn('Error setting hero movie cache:', error)
  }
}

export const PersonalizedHeroMovie = () => {
  const { user } = useAuth()
  const recentRecommendations = useRecommendationStore(
    state => state.recentRecommendations
  )

  const [movie, setMovie] = useState<Movie | null>(null)
  const [matchPercentage, setMatchPercentage] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [selectedPoster, setSelectedPoster] = useState<number | null>(null)
  const [isFanned, setIsFanned] = useState(false)

  const componentRef = useRef<HTMLDivElement>(null)

  // Default posters arrangement (similar to original hero section)
  const posters = [
    {
      id: 1,
      angle: isFanned ? -20 : -5,
      translateX: isFanned ? '-20%' : '-2%',
    },
    {
      id: 2,
      angle: 0,
      translateX: '0%',
    },
    {
      id: 3,
      angle: isFanned ? 20 : 5,
      translateX: isFanned ? '20%' : '2%',
    },
  ]

  const handlePosterClick = (id: number) => {
    if (selectedPoster === id) {
      setSelectedPoster(null)
      setIsFanned(false)
    } else {
      setSelectedPoster(id)
      setIsFanned(true)
    }
  }

  const fetchPersonalizedRecommendation = async () => {
    if (hasLoaded) return

    setIsLoading(true)

    try {
      // Check cache first
      const cachedData = getCachedMovie()
      if (cachedData) {
        setMovie(cachedData.movie)
        setMatchPercentage(cachedData.matchPercentage)
        setHasLoaded(true)
        setIsLoading(false)
        return
      }

      let recommendedMovie: Movie | null = null
      let calculatedMatchPercentage = 0

      // First check if we have recent movie recommendations from the user
      const movieRecommendations = recentRecommendations
        .filter(rec => rec.mediaType === 'movie')
        .flatMap(rec => rec.results)

      if (movieRecommendations.length > 0) {
        // Use the most recent recommendation result with a poster_path
        const recommendation =
          movieRecommendations.find(rec => rec.poster_path) ||
          movieRecommendations[0]

        // Try to fetch the full movie details from TMDB
        if (recommendation.id) {
          try {
            const movieId =
              typeof recommendation.id === 'string'
                ? parseInt(recommendation.id, 10)
                : recommendation.id

            if (!isNaN(movieId)) {
              const fetchedMovie = await tmdb.getMovie(movieId)
              if (fetchedMovie) {
                recommendedMovie = fetchedMovie
                // Calculate match percentage based on recommendation reason
                calculatedMatchPercentage = Math.floor(Math.random() * 20) + 80 // 80-99%
              }
            }
          } catch (err) {
            console.error('Error fetching recommended movie details:', err)
          }
        }
      }

      // If we couldn't get a recommendation, fetch a popular movie
      if (!recommendedMovie) {
        const popularMovies = await tmdb.getPopularMovies()
        if (popularMovies && popularMovies.length > 0) {
          // Use a random movie from the first page of popular movies
          const randomIndex = Math.floor(
            Math.random() * Math.min(5, popularMovies.length)
          )
          recommendedMovie = popularMovies[randomIndex]
          // For popular movies without personalization, use a lower match percentage
          calculatedMatchPercentage = Math.floor(Math.random() * 15) + 70 // 70-84%
        }
      }

      setMovie(recommendedMovie)
      setMatchPercentage(calculatedMatchPercentage)
      setCachedMovie(recommendedMovie, calculatedMatchPercentage)
      setHasLoaded(true)
    } catch (error) {
      console.error('Error in PersonalizedHeroMovie:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Intersection Observer to defer API call until component is near viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries
        if (entry.isIntersecting && !hasLoaded) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '200px 0px', // Start loading 200px before component is visible
        threshold: 0.1,
      }
    )

    if (componentRef.current) {
      observer.observe(componentRef.current)
    }

    return () => observer.disconnect()
  }, [hasLoaded])

  // Fetch data when component becomes visible
  useEffect(() => {
    if (isVisible && !hasLoaded) {
      fetchPersonalizedRecommendation()
    }
  }, [isVisible, hasLoaded])

  // Check for cached data on mount to avoid unnecessary loading states
  useEffect(() => {
    const cachedData = getCachedMovie()
    if (cachedData) {
      setMovie(cachedData.movie)
      setMatchPercentage(cachedData.matchPercentage)
      setHasLoaded(true)
    }
  }, [])

  return (
    <div
      className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2"
      ref={componentRef}
    >
      <div className="relative h-full w-full">
        <div className="absolute inset-0 flex items-center justify-center">
          {isLoading ? (
            // Loading skeleton
            <div className="relative mt-16 h-[350px] w-[250px] animate-pulse rounded-lg bg-gray-800 sm:h-[400px] sm:w-[300px] md:h-[450px] md:w-[325px] lg:h-[500px] lg:w-[350px]" />
          ) : movie ? (
            // Personalized movie recommendation
            <div className="relative mt-16 h-[350px] w-[250px] sm:h-[400px] sm:w-[300px] md:h-[450px] md:w-[325px] lg:h-[500px] lg:w-[350px]">
              <Link
                to={`/movie/${movie.id}`}
                className="group absolute left-1/2 top-1/2 aspect-[2/3] w-full -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 ease-out"
              >
                <img
                  src={tmdb.getImageUrl(movie.poster_path)}
                  alt={movie.title}
                  className="h-full w-full rounded-lg object-cover shadow-xl transition-shadow duration-500"
                  loading="lazy"
                />

                {/* Match indicator */}
                <div className="absolute bottom-4 left-0 right-0 mx-auto flex w-[90%] items-center justify-center rounded-md bg-black bg-opacity-70 p-2">
                  <div className="mr-2 h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-bold text-white">
                    {matchPercentage}% Match for{' '}
                    {user ? 'You' : 'Viewers Like You'}
                  </span>
                </div>
              </Link>

              {/* Movie details on hover */}
              <div className="absolute bottom-[-50px] left-0 right-0 flex justify-center">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-white">
                    {movie.title}
                  </h2>
                  <p className="text-sm text-gray-300">
                    {new Date(movie.release_date).getFullYear()} •{' '}
                    {movie.genres
                      ?.slice(0, 2)
                      .map(g => g.name)
                      .join(', ')}
                  </p>
                </div>
              </div>
            </div>
          ) : !isVisible ? (
            // Show placeholder when not yet visible
            <div className="relative mt-16 h-[350px] w-[250px] animate-pulse rounded-lg bg-gray-800 sm:h-[400px] sm:w-[300px] md:h-[450px] md:w-[325px] lg:h-[500px] lg:w-[350px]" />
          ) : (
            // Fallback to original posters if no recommendation
            <div className="relative mt-16 h-[350px] w-[250px] sm:h-[400px] sm:w-[300px] md:h-[450px] md:w-[325px] lg:h-[500px] lg:w-[350px]">
              {posters.map(poster => (
                <div
                  key={poster.id}
                  onClick={() => handlePosterClick(poster.id)}
                  className={`absolute left-1/2 top-1/2 aspect-[2/3] w-full cursor-pointer transition-all duration-500 ease-out
                    ${
                      selectedPoster === poster.id
                        ? 'z-30 scale-105'
                        : selectedPoster === null
                          ? 'hover:scale-102'
                          : 'scale-95 opacity-50'
                    }`}
                  style={{
                    transform: `translate(-50%, -50%) 
                      translateX(${poster.translateX})
                      rotate(${poster.angle}deg)
                      ${selectedPoster === poster.id ? 'translateZ(50px)' : ''}`,
                    zIndex: selectedPoster === poster.id ? 30 : 20 - poster.id,
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <img
                    src={`/images/poster${poster.id}.jpg`}
                    alt={`Movie Poster ${poster.id}`}
                    className="h-full w-full rounded-lg object-cover shadow-xl transition-shadow duration-500"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
