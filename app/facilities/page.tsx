import { Metadata } from 'next'
import FacilitiesClient from './facilities-client'

export const metadata: Metadata = {
  title: 'Our Facilities | Maqbool Sports Complex',
  description: 'Explore our premium sports facilities including 10,000+ sq. ft. synthetic turf, professional cricket nets, and floodlit playing areas in Baramulla, Kashmir.',
}

export default function FacilitiesPage() {
  return <FacilitiesClient />
}
