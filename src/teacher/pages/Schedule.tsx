import { WeekSchedule } from '../../panel/pages/Schedule'
import { useTeacherPanel } from '../context'

export default function Schedule() {
  const { now, courses } = useTeacherPanel()
  return <WeekSchedule now={now} courses={courses} emptyDay="کلاسی ندارید" />
}
