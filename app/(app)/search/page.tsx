import { DUMMY_COURSES } from '@/lib/dummy-data'
import { SearchClient } from './_components/search-client'

export default function SearchPage() {
  return <SearchClient courses={DUMMY_COURSES} />
}
