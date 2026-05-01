import { DUMMY_COURSES } from '@/lib/dummy-data'
import { CoursesClient } from './_components/courses-client'

export default function CoursesPage() {
  return <CoursesClient courses={DUMMY_COURSES} />
}
