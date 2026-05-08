import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'advancing' | 'rejected' | 'accepted'

export interface GuideApplication {
  id: string
  created_at: string
  updated_at: string
  full_name: string
  email: string
  phone: string
  role_at_alpha: string
  campus: string
  years_at_alpha: string
  direct_manager: string
  head_of_school: string
  languages_spoken: string
  prior_international_travel: string
  developing_world_experience: string
  health_considerations: string
  family_obligations: string
  emergency_contact: string
  build1_link: string
  build2_design_link: string
  build2_video_link: string
  build3_video_link: string
  build4_language_link: string
  reference1_name: string
  reference1_role: string
  reference1_relationship: string
  reference1_phone: string
  reference1_email: string
  reference2_name: string
  reference2_role: string
  reference2_relationship: string
  reference2_phone: string
  reference2_email: string
  manager_endorsement_status: string
  manager_endorsement_text: string
  endorser_name: string
  endorser_role: string
  ack_1: boolean
  ack_2: boolean
  ack_3: boolean
  ack_4: boolean
  ack_5: boolean
  ack_6: boolean
  ack_7: boolean
  ack_8: boolean
  applicant_name: string
  status: ApplicationStatus
  admin_notes: string
  draft_step: number
}
