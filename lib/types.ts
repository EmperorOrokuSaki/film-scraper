export interface FilmScreening {
  title: string
  date: string
  runtime?: string
  category?: string
  description?: string
  imageUrl?: string
  url?: string
  tags?: string[]
  director?: string
  year?: string
  source?: "babylon" | "yorck" | "uci"
  genre?: string
  day?: string // Added for grouping by day
  showtimes?: Showtime[] // Added for storing multiple showtimes
}

export interface Showtime {
  time: string
  cinema?: string
  url?: string
  date?: string // Added to store the actual date of this showtime
  format?: string // Added to store format information (OmU, OV, DF, etc.)
  exactDateTime?: string // Added to store the exact date and time for filtering
}

export interface DayGroup {
  date: string
  screenings: FilmScreening[]
}

// Debug data types
export interface YorckDebugData {
  url: string
  status: number
  date: string
  rawHtml: string
  parsedFilms: FilmScreening[]
  filmsWithShowtimes: number
  totalFilmsInPage: number
  nextData?: any // Raw JSON data from __NEXT_DATA__
}

// UCI Debug data types
export interface UCIDebugData {
  url: string
  status: number
  date: string
  rawFilmListJson: string
  rawShowtimesHtml: string
  parsedFilms: FilmScreening[]
  filmsWithShowtimes: number
  totalFilmsInPage: number
  mockData: boolean
}

// Yorck API types
export interface YorckFilmData {
  sys: {
    id: string
  }
  fields: {
    title: string
    vistaId: string
    yorckPick?: boolean
    runtime?: number
    mainLabel?: string
    heroImage?: {
      fields: {
        image: {
          fields: {
            description: string
            title: string
            file: {
              url: string
              details: {
                image: {
                  width: number
                  height: number
                }
              }
            }
          }
        }
      }
    }
    fsk?: number
    tagline?: string
    slug?: string
    descriptors?: string[]
    releaseDate?: string
    distributor?: string
    sessions: YorckSessionData[]
  }
}

export interface YorckSessionData {
  sys: {
    id: string
  }
  fields: {
    startTime: string
    formats?: string[]
    cinema?: {
      fields: {
        name: string
        accessibility?: string
      }
    }
  }
}

// UCI Kinowelt types
export interface UCIFilm {
  id: number
  title: string
  fsk: string
  poster: string
  seonize: string
  startdate: {
    date: string
    timezone_type: number
    timezone: string
  }
  playweek: number
  genre: string
  runtime: string
  recommended: number
  attributes: string[]
}

export interface UCIShowtime {
  date: string
  time: string
  format: string
  cinema: string
  bookingUrl: string
  isOV: boolean
  isIMAX: boolean
  isISense: boolean
  is3D: boolean
  isScreenX: boolean
}
