'use client'

import { useEffect, useState } from 'react'
import {
  BadgeEuro,
  ChevronDown,
  CheckCircle2,
  Hourglass,
  ImagePlus,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Megaphone,
  MessageSquare,
  PencilLine,
  Plus,
  PartyPopper,
  ReceiptText,
  Sparkles,
  Tags,
  Trash2,
  UploadCloud,
  UserCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const PROVINCE_OPTIONS = [
  'A Coruna',
  'Alava',
  'Albacete',
  'Alicante',
  'Almeria',
  'Asturias',
  'Avila',
  'Badajoz',
  'Barcelona',
  'Burgos',
  'Caceres',
  'Cadiz',
  'Cantabria',
  'Castellon',
  'Ciudad Real',
  'Cordoba',
  'Cuenca',
  'Girona',
  'Granada',
  'Guadalajara',
  'Gipuzkoa',
  'Huelva',
  'Huesca',
  'Illes Balears',
  'Jaen',
  'La Rioja',
  'Las Palmas',
  'Leon',
  'Lleida',
  'Lugo',
  'Madrid',
  'Malaga',
  'Murcia',
  'Navarra',
  'Ourense',
  'Palencia',
  'Pontevedra',
  'Salamanca',
  'Santa Cruz de Tenerife',
  'Segovia',
  'Sevilla',
  'Soria',
  'Tarragona',
  'Teruel',
  'Toledo',
  'Valencia',
  'Valladolid',
  'Vizcaya',
  'Zamora',
  'Zaragoza',
]

const MUSIC_OPTIONS = ['Comercial', 'Electrónica', 'Pop', 'Indie', 'Flamenquito', 'Remember']
const AUDIENCE_OPTIONS = ['18-25', '25-35', '30+', 'Mixto']
const PROMOTION_PACKAGES = [
  {
    id: 'launch',
    name: 'Lanzamiento',
    price: 149,
    description: 'Destacado en web + redes sociales + newsletter',
  },
  {
    id: 'amplified',
    name: 'Amplificado',
    price: 99,
    description: 'Destacado en web + redes sociales',
  },
  {
    id: 'boost',
    name: 'Impulso',
    price: 49,
    description: 'Destacado en web',
  },
]

function generateSlug(title: string, date: string) {
  const cleanTitle = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return date ? `${cleanTitle}-${date}` : cleanTitle
}

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [panelMode, setPanelMode] = useState<'events' | 'data' | 'profile' | 'resources' | 'brands'>('events')
  const [eventView, setEventView] = useState<'all' | 'approved' | 'pending' | 'chat'>('all')
  const [templates, setTemplates] = useState<any[]>([])
  const [eventProfiles, setEventProfiles] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedEventProfileId, setSelectedEventProfileId] = useState('')
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [saveAsTemplateName, setSaveAsTemplateName] = useState('')
  const [promotionOpen, setPromotionOpen] = useState(false)
  const [selectedPromotionPackage, setSelectedPromotionPackage] = useState('')
  const [templateMessage, setTemplateMessage] = useState('')
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [editingEventProfileId, setEditingEventProfileId] = useState<string | null>(null)
  const [eventProfileMessage, setEventProfileMessage] = useState('')

  const [promoterEventName, setPromoterEventName] = useState('')
  const [promoterContactName, setPromoterContactName] = useState('')
  const [promoterCompany, setPromoterCompany] = useState('')
  const [promoterTaxId, setPromoterTaxId] = useState('')
  const [promoterAddress, setPromoterAddress] = useState('')
  const [promoterMunicipality, setPromoterMunicipality] = useState('')
  const [promoterPostalCode, setPromoterPostalCode] = useState('')
  const [promoterProvince, setPromoterProvince] = useState('Madrid')
  const [promoterWebsite, setPromoterWebsite] = useState('')
  const [promoterDescription, setPromoterDescription] = useState('')
  const [promoterLogoUrl, setPromoterLogoUrl] = useState('')
  const [promoterLogoFile, setPromoterLogoFile] = useState<File | null>(null)
  const [promoterLogoPreview, setPromoterLogoPreview] = useState('')
  const [billingDifferent, setBillingDifferent] = useState(false)
  const [billingName, setBillingName] = useState('')
  const [billingTaxId, setBillingTaxId] = useState('')
  const [billingAddress, setBillingAddress] = useState('')
  const [billingMunicipality, setBillingMunicipality] = useState('')
  const [billingPostalCode, setBillingPostalCode] = useState('')
  const [billingProvince, setBillingProvince] = useState('Madrid')
  const [billingEmail, setBillingEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [title, setTitle] = useState('')
  const [venue, setVenue] = useState('')
  const [area, setArea] = useState('')
  const [customArea, setCustomArea] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('')
  const [address, setAddress] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')
  const [startTime, setStartTime] = useState('17:00')
  const [endTime, setEndTime] = useState('23:00')
  const [priceFrom, setPriceFrom] = useState('')
  const [isInvitation, setIsInvitation] = useState(false)
  const [music, setMusic] = useState<string[]>([])
  const [audience, setAudience] = useState('25-35')
  const [cover, setCover] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [description, setDescription] = useState('')
  const [perks, setPerks] = useState('')

  const [templateName, setTemplateName] = useState('')
  const [templateTitle, setTemplateTitle] = useState('')
  const [templateVenue, setTemplateVenue] = useState('')
  const [templateArea, setTemplateArea] = useState('')
  const [templateCustomArea, setTemplateCustomArea] = useState('')
  const [templateAddress, setTemplateAddress] = useState('')
  const [templateMapsUrl, setTemplateMapsUrl] = useState('')
  const [templateType, setTemplateType] = useState('')
  const [templateMusic, setTemplateMusic] = useState<string[]>([])
  const [templateAudience, setTemplateAudience] = useState('25-35')
  const [templatePriceFrom, setTemplatePriceFrom] = useState('')
  const [templateIsInvitation, setTemplateIsInvitation] = useState(false)
  const [templateDescription, setTemplateDescription] = useState('')
  const [templatePerks, setTemplatePerks] = useState('')
  const [eventProfileName, setEventProfileName] = useState('')
  const [eventProfileLogoUrl, setEventProfileLogoUrl] = useState('')
  const [eventProfileLogoFile, setEventProfileLogoFile] = useState<File | null>(null)
  const [eventProfileLogoPreview, setEventProfileLogoPreview] = useState('')
  const [eventProfileBannerUrl, setEventProfileBannerUrl] = useState('')
  const [eventProfileBannerFile, setEventProfileBannerFile] = useState<File | null>(null)
  const [eventProfileBannerPreview, setEventProfileBannerPreview] = useState('')
  const [eventProfileDescription, setEventProfileDescription] = useState('')
  const [eventProfileType, setEventProfileType] = useState('Tardeo')
  const [eventProfileVenueName, setEventProfileVenueName] = useState('')
  const [eventProfileAddress, setEventProfileAddress] = useState('')
  const [eventProfileMunicipality, setEventProfileMunicipality] = useState('')
  const [eventProfilePostalCode, setEventProfilePostalCode] = useState('')
  const [eventProfileProvince, setEventProfileProvince] = useState('Madrid')
  const [eventProfileMusic, setEventProfileMusic] = useState<string[]>([])
  const [eventProfileAudience, setEventProfileAudience] = useState('25-35')
  const [eventProfileInstagramUrl, setEventProfileInstagramUrl] = useState('')
  const [eventProfileTiktokUrl, setEventProfileTiktokUrl] = useState('')
  const [eventProfileWebsiteUrl, setEventProfileWebsiteUrl] = useState('')
  const [eventProfileActive, setEventProfileActive] = useState(true)

  const profileComplete =
    promoterEventName &&
    promoterContactName &&
    promoterCompany &&
    promoterTaxId &&
    promoterAddress &&
    promoterMunicipality &&
    promoterPostalCode &&
    promoterProvince

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login?type=venue'
        return
      }

      setEmail(user.email ?? null)
      setUserId(user.id)
      setBillingEmail(user.email ?? '')

      const { data: profile } = await supabase
        .from('profiles')
        .select(
          'venue_name, promoter_event_name, promoter_contact_name, promoter_company, promoter_tax_id, promoter_address, promoter_municipality, promoter_postal_code, promoter_province, promoter_website, promoter_description, promoter_logo_url, billing_different, billing_name, billing_tax_id, billing_address, billing_municipality, billing_postal_code, billing_province, billing_email'
        )
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        const commercialName = profile.promoter_event_name ?? profile.venue_name ?? ''
        setPromoterEventName(commercialName)
        setPromoterContactName(profile.promoter_contact_name ?? '')
        setPromoterCompany(profile.promoter_company ?? '')
        setPromoterTaxId(profile.promoter_tax_id ?? '')
        setPromoterAddress(profile.promoter_address ?? '')
        setPromoterMunicipality(profile.promoter_municipality ?? '')
        setPromoterPostalCode(profile.promoter_postal_code ?? '')
        setPromoterProvince(profile.promoter_province ?? 'Madrid')
        setPromoterWebsite(profile.promoter_website ?? '')
        setPromoterDescription(profile.promoter_description ?? '')
        setPromoterLogoUrl(profile.promoter_logo_url ?? '')
        setBillingDifferent(Boolean(profile.billing_different))
        setBillingName(profile.billing_name ?? '')
        setBillingTaxId(profile.billing_tax_id ?? '')
        setBillingAddress(profile.billing_address ?? '')
        setBillingMunicipality(profile.billing_municipality ?? '')
        setBillingPostalCode(profile.billing_postal_code ?? '')
        setBillingProvince(profile.billing_province ?? 'Madrid')
        setBillingEmail(profile.billing_email ?? user.email ?? '')
        if (!commercialName || !profile.promoter_contact_name || !profile.promoter_company) {
          setPanelMode('data')
        }
      } else {
        setPanelMode('data')
      }

      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })

      setEvents(data || [])

      const { data: templateData } = await supabase
        .from('event_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      setTemplates(templateData || [])

      const { data: eventProfileData } = await supabase
        .from('promoter_event_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      setEventProfiles(eventProfileData || [])
      setLoading(false)
    }

    loadDashboard()
  }, [])

  async function refreshEvents() {
    if (!userId) return

    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })

    setEvents(data || [])
  }

  async function refreshTemplates() {
    if (!userId) return

    const { data } = await supabase
      .from('event_templates')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    setTemplates(data || [])
  }

  async function refreshEventProfiles() {
    if (!userId) return

    const { data } = await supabase
      .from('promoter_event_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    setEventProfiles(data || [])
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  function applyArea(value: string | null, target: 'event' | 'template') {
    const commonAreas = ['Centro', 'Salamanca', 'Retiro']
    const nextArea = value || ''

    if (target === 'event') {
      if (!nextArea || commonAreas.includes(nextArea)) {
        setArea(nextArea)
        setCustomArea('')
      } else {
        setArea('Otra')
        setCustomArea(nextArea)
      }
      return
    }

    if (!nextArea || commonAreas.includes(nextArea)) {
      setTemplateArea(nextArea)
      setTemplateCustomArea('')
    } else {
      setTemplateArea('Otra')
      setTemplateCustomArea(nextArea)
    }
  }

  function applyTemplateToEvent(templateId: string) {
    setSelectedTemplateId(templateId)

    const template = templates.find((item) => item.id === templateId)
    if (!template) return

    setTitle(template.title ?? '')
    setVenue(template.venue ?? '')
    applyArea(template.area ?? '', 'event')
    setAddress(template.address ?? '')
    setMapsUrl(template.maps_url ?? '')
    setType(template.type ?? '')
    setMusic(template.music ?? [])
    setAudience(template.audience ?? '25-35')
    const templatePrice = Number(template.price_from ?? 0)
    setIsInvitation(templatePrice === 0)
    setPriceFrom(templatePrice > 0 ? String(templatePrice) : '')
    setDescription(template.description ?? '')
    setPerks((template.perks ?? []).join(', '))
  }

  function applyEventProfileToEvent(profileId: string) {
    setSelectedEventProfileId(profileId)

    const profile = eventProfiles.find((item) => item.id === profileId)
    if (!profile) return

    setTitle(profile.name ?? '')
    setType(profile.type ?? 'Tardeo')
    setVenue(profile.venue_name ?? '')
    applyArea(profile.municipality ?? '', 'event')
    setAddress(profile.address ?? '')
    setMusic(profile.music ?? [])
    setAudience(profile.audience ?? '25-35')
    setDescription(profile.description ?? '')
  }

  function enterEventProfile(profile: any) {
    applyEventProfileToEvent(profile.id)
    setPanelMode('events')
    setEventView('all')
    setMessage('')
  }

  function resetTemplateForm() {
    setEditingTemplateId(null)
    setTemplateName('')
    setTemplateTitle('')
    setTemplateVenue('')
    setTemplateArea('')
    setTemplateCustomArea('')
    setTemplateAddress('')
    setTemplateMapsUrl('')
    setTemplateType('')
    setTemplateMusic([])
    setTemplateAudience('25-35')
    setTemplatePriceFrom('')
    setTemplateIsInvitation(false)
    setTemplateDescription('')
    setTemplatePerks('')
    setTemplateMessage('')
  }

  function resetEventProfileForm() {
    setEditingEventProfileId(null)
    setEventProfileName('')
    setEventProfileLogoUrl('')
    setEventProfileLogoFile(null)
    setEventProfileLogoPreview('')
    setEventProfileBannerUrl('')
    setEventProfileBannerFile(null)
    setEventProfileBannerPreview('')
    setEventProfileDescription('')
    setEventProfileType('Tardeo')
    setEventProfileVenueName('')
    setEventProfileAddress('')
    setEventProfileMunicipality('')
    setEventProfilePostalCode('')
    setEventProfileProvince('Madrid')
    setEventProfileMusic([])
    setEventProfileAudience('25-35')
    setEventProfileInstagramUrl('')
    setEventProfileTiktokUrl('')
    setEventProfileWebsiteUrl('')
    setEventProfileActive(true)
    setEventProfileMessage('')
  }

  function editEventProfile(profile: any) {
    setEditingEventProfileId(profile.id)
    setEventProfileName(profile.name ?? '')
    setEventProfileLogoUrl(profile.logo_url ?? '')
    setEventProfileLogoFile(null)
    setEventProfileLogoPreview('')
    setEventProfileBannerUrl(profile.banner_url ?? '')
    setEventProfileBannerFile(null)
    setEventProfileBannerPreview('')
    setEventProfileDescription(profile.description ?? '')
    setEventProfileType(profile.type ?? 'Tardeo')
    setEventProfileVenueName(profile.venue_name ?? '')
    setEventProfileAddress(profile.address ?? '')
    setEventProfileMunicipality(profile.municipality ?? '')
    setEventProfilePostalCode(profile.postal_code ?? '')
    setEventProfileProvince(profile.province ?? 'Madrid')
    setEventProfileMusic(profile.music ?? [])
    setEventProfileAudience(profile.audience ?? '25-35')
    setEventProfileInstagramUrl(profile.instagram_url ?? '')
    setEventProfileTiktokUrl(profile.tiktok_url ?? '')
    setEventProfileWebsiteUrl(profile.website_url ?? '')
    setEventProfileActive(profile.is_active ?? true)
    setEventProfileMessage('')
  }

  function editTemplate(template: any) {
    setEditingTemplateId(template.id)
    setTemplateName(template.name ?? '')
    setTemplateTitle(template.title ?? '')
    setTemplateVenue(template.venue ?? '')
    applyArea(template.area ?? '', 'template')
    setTemplateAddress(template.address ?? '')
    setTemplateMapsUrl(template.maps_url ?? '')
    setTemplateType(template.type ?? '')
    setTemplateMusic(template.music ?? [])
    setTemplateAudience(template.audience ?? '25-35')
    const templatePrice = Number(template.price_from ?? 0)
    setTemplateIsInvitation(templatePrice === 0)
    setTemplatePriceFrom(templatePrice > 0 ? String(templatePrice) : '')
    setTemplateDescription(template.description ?? '')
    setTemplatePerks((template.perks ?? []).join(', '))
    setTemplateMessage('')
  }

  function toggleTemplateMusicStyle(style: string) {
    setTemplateMusic((current) =>
      current.includes(style)
        ? current.filter((item) => item !== style)
        : [...current, style]
    )
  }

  function toggleEventProfileMusicStyle(style: string) {
    setEventProfileMusic((current) =>
      current.includes(style)
        ? current.filter((item) => item !== style)
        : [...current, style]
    )
  }

  async function savePromoterProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    setSavingProfile(true)
    setProfileMessage('')

    const finalBillingName = billingDifferent ? billingName : promoterCompany
    const finalBillingTaxId = billingDifferent ? billingTaxId : promoterTaxId
    const finalBillingAddress = billingDifferent ? billingAddress : promoterAddress
    const finalBillingMunicipality = billingDifferent ? billingMunicipality : promoterMunicipality
    const finalBillingPostalCode = billingDifferent ? billingPostalCode : promoterPostalCode
    const finalBillingProvince = billingDifferent ? billingProvince : promoterProvince
    const finalBillingEmail = billingDifferent ? billingEmail : email ?? ''

    const { error } = await supabase.from('profiles').upsert(
      {
        id: userId,
        role: 'venue',
        venue_name: promoterEventName,
        promoter_event_name: promoterEventName,
        promoter_contact_name: promoterContactName,
        promoter_company: promoterCompany,
        promoter_tax_id: promoterTaxId,
        promoter_address: promoterAddress,
        promoter_municipality: promoterMunicipality,
        promoter_postal_code: promoterPostalCode,
        promoter_province: promoterProvince,
        promoter_website: promoterWebsite,
        promoter_description: promoterDescription,
        promoter_logo_url: promoterLogoUrl,
        billing_different: billingDifferent,
        billing_name: finalBillingName,
        billing_tax_id: finalBillingTaxId,
        billing_address: finalBillingAddress,
        billing_municipality: finalBillingMunicipality,
        billing_postal_code: finalBillingPostalCode,
        billing_province: finalBillingProvince,
        billing_email: finalBillingEmail,
      },
      { onConflict: 'id' }
    )

    setSavingProfile(false)

    if (error) {
      setProfileMessage(`Error al guardar: ${error.message}`)
      return
    }

    setBillingName(finalBillingName)
    setBillingTaxId(finalBillingTaxId)
    setBillingAddress(finalBillingAddress)
    setBillingMunicipality(finalBillingMunicipality)
    setBillingPostalCode(finalBillingPostalCode)
    setBillingProvince(finalBillingProvince)
    setBillingEmail(finalBillingEmail)
    setProfileMessage('Datos guardados correctamente')
    setPanelMode('events')
  }

  async function updatePassword() {
    setPasswordMessage('')

    if (newPassword.length < 6) {
      setPasswordMessage('La contrasena debe tener al menos 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage('Las contrasenas no coinciden.')
      return
    }

    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPassword(false)

    if (error) {
      setPasswordMessage(`No se pudo cambiar la contrasena: ${error.message}`)
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    setPasswordMessage('Contrasena actualizada correctamente.')
  }

  async function savePublicProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    setSavingProfile(true)
    setProfileMessage('')

    let nextLogoUrl = promoterLogoUrl

    if (promoterLogoFile) {
      const fileName = `promoters/${userId}/${Date.now()}-${promoterLogoFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(fileName, promoterLogoFile, { upsert: true })

      if (uploadError) {
        setProfileMessage(`Error subiendo imagen: ${uploadError.message}`)
        setSavingProfile(false)
        return
      }

      const { data } = supabase.storage.from('events').getPublicUrl(fileName)
      nextLogoUrl = data.publicUrl
    }

    const { error } = await supabase.from('profiles').upsert(
      {
        id: userId,
        role: 'venue',
        venue_name: promoterEventName,
        promoter_event_name: promoterEventName,
        promoter_website: promoterWebsite,
        promoter_description: promoterDescription,
        promoter_logo_url: nextLogoUrl,
      },
      { onConflict: 'id' }
    )

    setSavingProfile(false)

    if (error) {
      setProfileMessage(`Error al guardar: ${error.message}`)
      return
    }

    setPromoterLogoUrl(nextLogoUrl)
    setPromoterLogoFile(null)
    setPromoterLogoPreview('')
    setProfileMessage('Perfil guardado correctamente')
  }

  async function saveTemplate(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    setSaving(true)
    setTemplateMessage('')

    const finalArea = templateArea === 'Otra' ? templateCustomArea || null : templateArea || null
    const templatePayload = {
      user_id: userId,
      name: templateName,
      title: templateTitle,
      venue: templateVenue || null,
      area: finalArea,
      address: templateAddress || null,
      maps_url: templateMapsUrl || null,
      type: templateType || null,
      music: templateMusic,
      audience: templateAudience,
      price_from: templateIsInvitation ? 0 : templatePriceFrom ? parseFloat(templatePriceFrom) : 0,
      description: templateDescription || null,
      perks: templatePerks ? templatePerks.split(',').map((perk) => perk.trim()).filter(Boolean) : [],
      updated_at: new Date().toISOString(),
    }

    const query = editingTemplateId
      ? supabase.from('event_templates').update(templatePayload).eq('id', editingTemplateId)
      : supabase.from('event_templates').insert(templatePayload)

    const { error } = await query

    setSaving(false)

    if (error) {
      setTemplateMessage(`No se pudo guardar la ficha: ${error.message}`)
      return
    }

    setTemplateMessage(editingTemplateId ? 'Ficha actualizada' : 'Ficha creada')
    resetTemplateForm()
    await refreshTemplates()
  }

  async function deleteTemplate(templateId: string) {
    setTemplateMessage('')

    const { error } = await supabase
      .from('event_templates')
      .delete()
      .eq('id', templateId)

    if (error) {
      setTemplateMessage(`No se pudo borrar la ficha: ${error.message}`)
      return
    }

    if (selectedTemplateId === templateId) setSelectedTemplateId('')
    await refreshTemplates()
  }

  async function saveEventProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return

    setSaving(true)
    setEventProfileMessage('')

    let nextLogoUrl = eventProfileLogoUrl
    let nextBannerUrl = eventProfileBannerUrl

    if (eventProfileLogoFile) {
      const fileName = `promoter-event-profiles/${userId}/logos/${Date.now()}-${eventProfileLogoFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(fileName, eventProfileLogoFile, { upsert: true })

      if (uploadError) {
        setEventProfileMessage(`Error subiendo logo: ${uploadError.message}`)
        setSaving(false)
        return
      }

      const { data } = supabase.storage.from('events').getPublicUrl(fileName)
      nextLogoUrl = data.publicUrl
    }

    if (eventProfileBannerFile) {
      const fileName = `promoter-event-profiles/${userId}/banners/${Date.now()}-${eventProfileBannerFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(fileName, eventProfileBannerFile, { upsert: true })

      if (uploadError) {
        setEventProfileMessage(`Error subiendo banner: ${uploadError.message}`)
        setSaving(false)
        return
      }

      const { data } = supabase.storage.from('events').getPublicUrl(fileName)
      nextBannerUrl = data.publicUrl
    }

    const eventProfilePayload = {
      user_id: userId,
      name: eventProfileName,
      slug: generateSlug(eventProfileName, ''),
      logo_url: nextLogoUrl || null,
      banner_url: nextBannerUrl || null,
      description: eventProfileDescription || null,
      type: eventProfileType || null,
      venue_name: eventProfileVenueName || null,
      address: eventProfileAddress || null,
      municipality: eventProfileMunicipality || null,
      postal_code: eventProfilePostalCode || null,
      province: eventProfileProvince || null,
      music: eventProfileMusic,
      audience: eventProfileAudience,
      instagram_url: eventProfileInstagramUrl || null,
      tiktok_url: eventProfileTiktokUrl || null,
      website_url: eventProfileWebsiteUrl || null,
      is_active: eventProfileActive,
      updated_at: new Date().toISOString(),
    }

    const query = editingEventProfileId
      ? supabase
          .from('promoter_event_profiles')
          .update(eventProfilePayload)
          .eq('id', editingEventProfileId)
      : supabase.from('promoter_event_profiles').insert(eventProfilePayload)

    const { error } = await query

    setSaving(false)

    if (error) {
      setEventProfileMessage(`No se pudo guardar la fiesta: ${error.message}`)
      return
    }

    setEventProfileMessage(editingEventProfileId ? 'Fiesta actualizada' : 'Fiesta creada')
    setEventProfileLogoUrl(nextLogoUrl)
    setEventProfileBannerUrl(nextBannerUrl)
    resetEventProfileForm()
    await refreshEventProfiles()
    window.setTimeout(() => {
      document.getElementById('event-profiles-list')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 50)
  }

  async function deleteEventProfile(profileId: string) {
    setEventProfileMessage('')

    const { error } = await supabase
      .from('promoter_event_profiles')
      .delete()
      .eq('id', profileId)

    if (error) {
      setEventProfileMessage(`No se pudo borrar la fiesta: ${error.message}`)
      return
    }

    if (selectedEventProfileId === profileId) setSelectedEventProfileId('')
    await refreshEventProfiles()
    await refreshEvents()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login?type=venue'
      return
    }

    let imageUrl = ''

    if (cover) {
      const fileName = `${Date.now()}-${cover.name}`

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(fileName, cover)

      if (uploadError) {
        setMessage(`Error subiendo imagen: ${uploadError.message}`)
        setSaving(false)
        return
      }

      const { data } = supabase.storage.from('events').getPublicUrl(fileName)
      imageUrl = data.publicUrl
    }

    const promotionPackage = PROMOTION_PACKAGES.find(
      (item) => item.id === selectedPromotionPackage
    )

    const eventData = {
      title,
      slug: generateSlug(title, date),
      venue,
      area: area === 'Otra' ? customArea || null : area || null,
      address: address || null,
      maps_url: mapsUrl || null,
      date,
      start_time: startTime,
      end_time: endTime,
      type,
      music,
      audience,
      price_from: isInvitation ? 0 : priceFrom ? parseFloat(priceFrom) : 0,
      cover: imageUrl,
      featured: false,
      description,
      perks: perks ? perks.split(',').map((p) => p.trim()) : [],
      status: 'pending',
      published: false,
      user_id: user.id,
      event_profile_id: selectedEventProfileId || null,
      promotion_package: promotionPackage?.id ?? null,
      promotion_package_name: promotionPackage?.name ?? null,
      promotion_price: promotionPackage?.price ?? null,
      promotion_status: promotionPackage ? 'requested' : 'none',
      promotion_requested_at: promotionPackage ? new Date().toISOString() : null,
    }

    const { error } = await supabase.from('events').insert(eventData)

    if (error) {
      setMessage(`Error al crear evento: ${error.message}`)
      setSaving(false)
      return
    }

    if (saveAsTemplate) {
      const templateNameToSave = saveAsTemplateName || title

      const { error: templateError } = await supabase.from('event_templates').insert({
        user_id: user.id,
        name: templateNameToSave,
        title,
        venue,
        area: area === 'Otra' ? customArea || null : area || null,
        address: address || null,
        maps_url: mapsUrl || null,
        type,
        music,
        audience,
        price_from: isInvitation ? 0 : priceFrom ? parseFloat(priceFrom) : 0,
        description,
        perks: perks ? perks.split(',').map((p) => p.trim()).filter(Boolean) : [],
      })

      if (templateError) {
        setMessage(`Evento enviado, pero no se pudo guardar la ficha: ${templateError.message}`)
        await refreshEvents()
        await refreshTemplates()
        setSaving(false)
        return
      }
    }

    setMessage('Evento enviado correctamente. Queda pendiente de revision.')
    setSelectedTemplateId('')
    setSaveAsTemplate(false)
    setSaveAsTemplateName('')
    setPromotionOpen(false)
    setSelectedPromotionPackage('')
    setTitle('')
    setVenue('')
    setArea('')
    setCustomArea('')
    setDate('')
    setType('')
    setAddress('')
    setMapsUrl('')
    setStartTime('17:00')
    setEndTime('23:00')
    setPriceFrom('')
    setIsInvitation(false)
    setMusic([])
    setAudience('25-35')
    setCover(null)
    setPreviewUrl('')
    setDescription('')
    setPerks('')

    const activeProfile = eventProfiles.find(
      (profile) => profile.id === selectedEventProfileId
    )
    if (activeProfile) {
      setTitle(activeProfile.name ?? '')
      setType(activeProfile.type ?? 'Tardeo')
      setVenue(activeProfile.venue_name ?? '')
      applyArea(activeProfile.municipality ?? '', 'event')
      setAddress(activeProfile.address ?? '')
      setMusic(activeProfile.music ?? [])
      setAudience(activeProfile.audience ?? '25-35')
      setDescription(activeProfile.description ?? '')
    }

    await refreshEvents()
    await refreshTemplates()
    await refreshEventProfiles()
    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="container-page py-10">
          <p className="text-slate-400">Cargando panel...</p>
        </div>
      </main>
    )
  }

  const selectedEventProfile = eventProfiles.find(
    (profile) => profile.id === selectedEventProfileId
  )
  const scopedEvents = selectedEventProfile
    ? events.filter((event) => event.event_profile_id === selectedEventProfile.id)
    : events
  const allApprovedEvents = events.filter((event) => event.status === 'approved')
  const allPendingEvents = events.filter((event) => event.status === 'pending')
  const approvedEvents = scopedEvents.filter((event) => event.status === 'approved')
  const pendingEvents = scopedEvents.filter((event) => event.status === 'pending')
  const visibleEvents =
    eventView === 'approved'
      ? approvedEvents
      : eventView === 'pending'
        ? pendingEvents
        : scopedEvents
  const eventsListTitle =
    selectedEventProfile
      ? eventView === 'approved'
        ? `${selectedEventProfile.name}: aprobados`
        : eventView === 'pending'
          ? `${selectedEventProfile.name}: pendientes`
          : `${selectedEventProfile.name}: eventos`
      : eventView === 'approved'
        ? 'Eventos aprobados'
        : eventView === 'pending'
          ? 'Eventos pendientes'
          : 'Mis eventos'
  const emptyEventsMessage =
    eventView === 'approved'
      ? 'Ningun evento aprobado'
      : eventView === 'pending'
        ? 'Ningun evento pendiente'
        : 'No tienes eventos todavia.'
  const greetingName = promoterEventName || promoterCompany || 'promotor'
  const showDataForm = panelMode === 'data' || !profileComplete
  const showProfileForm = panelMode === 'profile' && profileComplete
  const showResources = panelMode === 'resources' && profileComplete
  const showTemplates = false
  const showEventProfiles = panelMode === 'brands' && profileComplete
  const logoDisplay = promoterLogoPreview || promoterLogoUrl

  function toggleMusicStyle(style: string) {
    setMusic((current) =>
      current.includes(style)
        ? current.filter((item) => item !== style)
        : [...current, style]
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto min-h-screen w-full max-w-6xl pb-12">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <a
              href="/"
              aria-label="Ir a TARDEA"
              className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 transition hover:border-brand-500/60 hover:bg-brand-500/15"
            >
              <img src="/tardea-icon.svg" alt="TARDEA" className="h-full w-full object-cover" />
            </a>

            <div className="flex min-w-0 items-center gap-2 text-xl font-black text-white sm:text-2xl">
              <LockKeyhole className="h-5 w-5 shrink-0 text-slate-300" />
              <span className="truncate">
                {greetingName.toLowerCase().replace(/\s+/g, '_')}
              </span>
            </div>

            <div className="relative flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setPanelMode('events')
                  setEventView('chat')
                }}
                aria-label="Chat"
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10"
              >
                <MessageSquare className="h-8 w-8 fill-white" />
                <span className="absolute right-1 top-0 h-5 min-w-5 rounded-full bg-brand-500 px-1 text-xs font-bold leading-5 text-white">
                  0
                </span>
              </button>

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10"
              aria-label="Abrir menu"
            >
              <ChevronDown className="h-8 w-8 text-slate-100" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEventProfileId('')
                    setPanelMode('events')
                    setEventView('all')
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/5"
                >
                  <UploadCloud className="h-4 w-4 text-brand-500" />
                  Subir eventos
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedEventProfileId('')
                    setPanelMode('events')
                    setEventView('all')
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/5"
                >
                  <ReceiptText className="h-4 w-4 text-brand-500" />
                  Editar eventos
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPanelMode('brands')
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/5"
                >
                  <Tags className="h-4 w-4 text-brand-500" />
                  Mis fiestas
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPanelMode('profile')
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/5"
                >
                  <PencilLine className="h-4 w-4 text-brand-500" />
                  Editar perfil
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPanelMode('resources')
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/5"
                >
                  <Megaphone className="h-4 w-4 text-brand-500" />
                  Lanzamiento
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPanelMode('data')
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/5"
                >
                  <ReceiptText className="h-4 w-4 text-brand-500" />
                  Datos y facturacion
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/5"
                >
                  <LogOut className="h-4 w-4 text-brand-500" />
                  Cerrar sesion
                </button>
              </div>
            )}
          </div>
          </div>
        </header>

        <section className="px-5 py-8">
          <div className="grid grid-cols-[auto_1fr] items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setPanelMode('profile')
                window.setTimeout(() => {
                  document.getElementById('promoter-profile-form')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }, 50)
              }}
              className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 via-fuchsia-500 to-orange-400 p-0.5 sm:h-20 sm:w-20"
            >
              <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-slate-900 text-white">
                {logoDisplay ? (
                  <img src={logoDisplay} alt={greetingName} className="h-full w-full object-cover" />
                ) : (
                  <UserCircle className="h-8 w-8" />
                )}
              </span>
              <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-950 bg-white text-slate-950">
                <Plus className="h-4 w-4" />
              </span>
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-black text-white md:text-3xl">
                {greetingName}
              </h1>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-black text-white">{events.length}</p>
                  <p className="text-xs font-semibold text-slate-300">Total subidos</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-400">{allApprovedEvents.length}</p>
                  <p className="text-xs font-semibold text-slate-300">Aprobados</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-red-500">{allPendingEvents.length}</p>
                  <p className="text-xs font-semibold text-slate-300">Pendientes</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedEventProfileId('')
                setPanelMode('events')
                setEventView('all')
              }}
              className="rounded-2xl bg-white/10 px-5 py-4 text-center text-lg font-bold text-white transition hover:bg-white/15"
            >
              Crear evento
            </button>

            <button
              type="button"
              onClick={() => setPanelMode('brands')}
              className="rounded-2xl bg-white/10 px-5 py-4 text-center text-lg font-bold text-white transition hover:bg-white/15"
            >
              Mis fiestas
            </button>
          </div>

          <div className="mt-8 grid grid-cols-4 border-b border-white/10 text-center">
            {[
              { key: 'all', icon: PartyPopper, label: 'Todos' },
              { key: 'approved', icon: CheckCircle2, label: 'Aprobados' },
              { key: 'pending', icon: Hourglass, label: 'Pendientes' },
              { key: 'chat', icon: MessageSquare, label: 'Chat' },
            ].map((item) => {
              const Icon = item.icon
              const isActive = eventView === item.key && panelMode === 'events'

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setPanelMode('events')
                    setEventView(item.key as 'all' | 'approved' | 'pending' | 'chat')
                  }}
                  aria-label={item.label}
                  className={`flex justify-center border-b-2 py-4 transition ${
                    isActive
                      ? 'border-white text-white'
                      : 'border-transparent text-slate-500 hover:text-white'
                  }`}
                >
                  <Icon className="h-9 w-9" />
                </button>
              )
            })}
          </div>
        </section>

        {showDataForm && (
          <form onSubmit={savePromoterProfile} className="card mx-5 mb-8 space-y-6 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Editar datos</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Datos de contacto, empresa y facturacion. Estos datos no son la pagina publica del promotor.
                </p>
              </div>

              {profileComplete && (
                <button
                  type="button"
                  onClick={() => setPanelMode('events')}
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Volver a eventos
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
                Acceso
              </p>
              <p className="mt-2 break-all text-lg font-semibold text-white">{email}</p>
              <p className="mt-1 text-sm text-slate-400">
                Este es el correo con el que entras al panel de promotor.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input className="input" placeholder="Evento o nombre comercial" value={promoterEventName} onChange={(e) => setPromoterEventName(e.target.value)} required />
              <input className="input" placeholder="Persona de contacto" value={promoterContactName} onChange={(e) => setPromoterContactName(e.target.value)} required />
              <input className="input" placeholder="Empresa" value={promoterCompany} onChange={(e) => setPromoterCompany(e.target.value)} required />
              <input className="input" placeholder="NIF" value={promoterTaxId} onChange={(e) => setPromoterTaxId(e.target.value)} required />
              <input className="input md:col-span-2" placeholder="Direccion" value={promoterAddress} onChange={(e) => setPromoterAddress(e.target.value)} required />
              <input className="input" placeholder="Municipio" value={promoterMunicipality} onChange={(e) => setPromoterMunicipality(e.target.value)} required />
              <input className="input" placeholder="Codigo postal" inputMode="numeric" maxLength={5} value={promoterPostalCode} onChange={(e) => setPromoterPostalCode(e.target.value)} required />
              <select className="select md:col-span-2" value={promoterProvince} onChange={(e) => setPromoterProvince(e.target.value)} required>
                {PROVINCE_OPTIONS.map((province) => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100">
              <input type="checkbox" checked={billingDifferent} onChange={(e) => setBillingDifferent(e.target.checked)} />
              Los datos de facturacion son diferentes a los datos de promotor
            </label>

            {billingDifferent && (
              <div className="grid gap-4 md:grid-cols-2">
                <input className="input" placeholder="Razon social o nombre fiscal" value={billingName} onChange={(e) => setBillingName(e.target.value)} required={billingDifferent} />
                <input className="input" placeholder="NIF / CIF" value={billingTaxId} onChange={(e) => setBillingTaxId(e.target.value)} required={billingDifferent} />
                <input className="input md:col-span-2" placeholder="Direccion fiscal" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} required={billingDifferent} />
                <input className="input" placeholder="Municipio fiscal" value={billingMunicipality} onChange={(e) => setBillingMunicipality(e.target.value)} required={billingDifferent} />
                <input className="input" placeholder="Codigo postal fiscal" inputMode="numeric" maxLength={5} value={billingPostalCode} onChange={(e) => setBillingPostalCode(e.target.value)} required={billingDifferent} />
                <select className="select" value={billingProvince} onChange={(e) => setBillingProvince(e.target.value)} required={billingDifferent}>
                  {PROVINCE_OPTIONS.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
                <input className="input" type="email" placeholder="Email de facturacion" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} required={billingDifferent} />
              </div>
            )}

            {!billingDifferent && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                Se usaran los mismos datos del promotor para facturacion. Activa la casilla si necesitas otra razon social, direccion o email fiscal.
              </div>
            )}

            <button className="btn-primary w-full" type="submit" disabled={savingProfile}>
              {savingProfile ? 'Guardando...' : 'Guardar datos'}
            </button>

            {profileMessage && <p className="text-sm text-brand-500">{profileMessage}</p>}

            <div className="border-t border-white/10 pt-6">
              <h3 className="text-xl font-bold">Cambiar contrasena</h3>
              <p className="mt-2 text-sm text-slate-400">
                Usa una contrasena nueva para acceder con este correo.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input
                  className="input"
                  type="password"
                  placeholder="Nueva contrasena"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <input
                  className="input"
                  type="password"
                  placeholder="Repetir contrasena"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="button"
                onClick={updatePassword}
                disabled={savingPassword}
                className="btn-secondary mt-4 w-full md:w-auto"
              >
                {savingPassword ? 'Actualizando...' : 'Cambiar contrasena'}
              </button>

              {passwordMessage && <p className="mt-3 text-sm text-brand-500">{passwordMessage}</p>}
            </div>
          </form>
        )}

        {showProfileForm && (
          <form id="promoter-profile-form" onSubmit={savePublicProfile} className="card mx-5 mb-8 space-y-6 p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Editar perfil</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-400">
                  Esta sera la ficha publica de tu sala o promotora: imagen, nombre, web y una descripcion clara de lo que haces.
                </p>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-slate-900">
                  {logoDisplay ? (
                    <img src={logoDisplay} alt={greetingName} className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="h-8 w-8 text-slate-500" />
                  )}
                </div>
                <label className="cursor-pointer rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10">
                  Subir logo o foto
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setPromoterLogoFile(file)
                      setPromoterLogoPreview(file ? URL.createObjectURL(file) : '')
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input className="input" placeholder="Nombre publico del evento, sala o promotora" value={promoterEventName} onChange={(e) => setPromoterEventName(e.target.value)} required />
              <input className="input" placeholder="Web o Instagram" value={promoterWebsite} onChange={(e) => setPromoterWebsite(e.target.value)} />
              <textarea
                className="input min-h-36 md:col-span-2"
                placeholder="A que se dedica, tipo de tardeos, musica, publico y propuesta del promotor"
                value={promoterDescription}
                onChange={(e) => setPromoterDescription(e.target.value)}
              />
            </div>

            <button className="btn-primary w-full" type="submit" disabled={savingProfile}>
              {savingProfile ? 'Guardando...' : 'Guardar perfil publico'}
            </button>

            {profileMessage && <p className="text-sm text-brand-500">{profileMessage}</p>}
          </form>
        )}

        {showTemplates && (
          <section className="grid gap-8 px-5 lg:grid-cols-[0.9fr_1.1fr]">
            <form onSubmit={saveTemplate} className="card space-y-6 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Fichas de eventos</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Guarda datos base para rellenar eventos futuros en segundos.
                  </p>
                </div>
                {editingTemplateId && (
                  <button
                    type="button"
                    onClick={resetTemplateForm}
                    className="text-sm font-semibold text-slate-400 hover:text-white"
                  >
                    Nueva ficha
                  </button>
                )}
              </div>

              <input className="input" placeholder="Nombre interno de la ficha" value={templateName} onChange={(e) => setTemplateName(e.target.value)} required />
              <input className="input" placeholder="Nombre del evento" value={templateTitle} onChange={(e) => setTemplateTitle(e.target.value)} required />
              <select className="select" value={templateType} onChange={(e) => setTemplateType(e.target.value)} required>
                <option value="">Tipo de evento</option>
                <option>Tardeo</option>
                <option>Rooftop</option>
                <option>Brunch</option>
                <option>Fitness Party</option>
                <option>Afterwork</option>
              </select>
              <select className="select" value={templateAudience} onChange={(e) => setTemplateAudience(e.target.value)} required>
                <option value="">Edad recomendada</option>
                {AUDIENCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-300">Estilos musicales</p>
                <div className="flex flex-wrap gap-2">
                  {MUSIC_OPTIONS.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleTemplateMusicStyle(style)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        templateMusic.includes(style)
                          ? 'bg-brand-500 text-white'
                          : 'bg-white/10 text-slate-300 hover:bg-white/15'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
              <select className="select" value={templateArea} onChange={(e) => setTemplateArea(e.target.value)} required>
                <option value="">Zona</option>
                <option>Centro</option>
                <option>Salamanca</option>
                <option>Retiro</option>
                <option value="Otra">Otra</option>
              </select>
              {templateArea === 'Otra' && <input className="input" placeholder="Zona personalizada" value={templateCustomArea} onChange={(e) => setTemplateCustomArea(e.target.value)} required />}
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100">
                <input type="checkbox" checked={templateIsInvitation} onChange={(e) => { setTemplateIsInvitation(e.target.checked); if (e.target.checked) setTemplatePriceFrom('') }} />
                Entrada con invitacion
              </label>
              {!templateIsInvitation && <input className="input" type="number" min="0" placeholder="Precio desde" value={templatePriceFrom} onChange={(e) => setTemplatePriceFrom(e.target.value)} />}
              <input className="input" placeholder="Lugar" value={templateVenue} onChange={(e) => setTemplateVenue(e.target.value)} required />
              <input className="input" placeholder="Direccion" value={templateAddress} onChange={(e) => setTemplateAddress(e.target.value)} required />
              <input className="input" placeholder="Link de Google Maps" value={templateMapsUrl} onChange={(e) => setTemplateMapsUrl(e.target.value)} />
              <textarea className="input min-h-32" placeholder="Descripcion base" value={templateDescription} onChange={(e) => setTemplateDescription(e.target.value)} required />
              <input className="input" placeholder="Extras separados por comas" value={templatePerks} onChange={(e) => setTemplatePerks(e.target.value)} />
              <button className="btn-primary w-full" type="submit" disabled={saving}>
                {saving ? 'Guardando...' : editingTemplateId ? 'Actualizar ficha' : 'Crear ficha'}
              </button>
              {templateMessage && <p className="text-sm text-brand-500">{templateMessage}</p>}
            </form>

            <section className="card p-6">
              <h2 className="text-2xl font-bold">Fichas guardadas</h2>
              <p className="mt-2 text-sm text-slate-400">
                Estas fichas apareceran en el selector de crear evento.
              </p>
              {templates.length === 0 && <p className="mt-6 text-slate-400">No tienes fichas guardadas todavia.</p>}
              <div className="mt-6 space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-white">{template.name}</h3>
                        <p className="mt-1 text-sm text-slate-400">{template.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {[template.venue, template.area, template.audience].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => editTemplate(template)}
                          className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTemplate(template.id)}
                          className="rounded-full border border-white/10 p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                          aria-label="Borrar ficha"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </section>
        )}

        {showEventProfiles && (
          <section className="flex flex-col gap-8 px-5">
            <form id="create-event-profile-form" onSubmit={saveEventProfile} className="card order-2 scroll-mt-24 space-y-6 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {editingEventProfileId ? 'Editar fiesta' : 'Crear fiesta'}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Crea marcas de eventos independientes dentro de tu empresa.
                  </p>
                </div>
                {editingEventProfileId && (
                  <button
                    type="button"
                    onClick={resetEventProfileForm}
                    className="text-sm font-semibold text-slate-400 hover:text-white"
                  >
                    Nueva fiesta
                  </button>
                )}
              </div>

              <input className="input" placeholder="Nombre de la fiesta" value={eventProfileName} onChange={(e) => setEventProfileName(e.target.value)} required />

              <select className="select" value={eventProfileType} onChange={(e) => setEventProfileType(e.target.value)} required>
                <option value="">Tipo de evento</option>
                <option>Tardeo</option>
                <option>Rooftop</option>
                <option>Brunch</option>
                <option>Fitness Party</option>
                <option>Afterwork</option>
              </select>

              <div className="grid gap-4 md:grid-cols-[0.75fr_1.25fr]">
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <p className="text-sm font-semibold text-slate-300">Logo o avatar</p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-950">
                      {eventProfileLogoPreview || eventProfileLogoUrl ? (
                        <img
                          src={eventProfileLogoPreview || eventProfileLogoUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImagePlus className="h-8 w-8 text-slate-500" />
                      )}
                    </div>
                    <label className="cursor-pointer rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10">
                      Subir logo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          setEventProfileLogoFile(file)
                          setEventProfileLogoPreview(file ? URL.createObjectURL(file) : '')
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <p className="text-sm font-semibold text-slate-300">Banner superior</p>
                  <div className="mt-4 overflow-hidden rounded-2xl bg-slate-950">
                    {eventProfileBannerPreview || eventProfileBannerUrl ? (
                      <img
                        src={eventProfileBannerPreview || eventProfileBannerUrl}
                        alt=""
                        className="h-28 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-28 items-center justify-center">
                        <ImagePlus className="h-8 w-8 text-slate-500" />
                      </div>
                    )}
                  </div>
                  <label className="mt-4 inline-flex cursor-pointer rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100 hover:bg-white/10">
                    Subir banner
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null
                        setEventProfileBannerFile(file)
                        setEventProfileBannerPreview(file ? URL.createObjectURL(file) : '')
                      }}
                    />
                  </label>
                </div>
              </div>

              <input className="input" placeholder="Sala o lugar habitual" value={eventProfileVenueName} onChange={(e) => setEventProfileVenueName(e.target.value)} />
              <input className="input" placeholder="Direccion habitual" value={eventProfileAddress} onChange={(e) => setEventProfileAddress(e.target.value)} />
              <div className="grid gap-4 md:grid-cols-2">
                <input className="input" placeholder="Municipio" value={eventProfileMunicipality} onChange={(e) => setEventProfileMunicipality(e.target.value)} />
                <input className="input" placeholder="Codigo postal" inputMode="numeric" maxLength={5} value={eventProfilePostalCode} onChange={(e) => setEventProfilePostalCode(e.target.value)} />
              </div>
              <select className="select" value={eventProfileProvince} onChange={(e) => setEventProfileProvince(e.target.value)}>
                {PROVINCE_OPTIONS.map((province) => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
              <select className="select" value={eventProfileAudience} onChange={(e) => setEventProfileAudience(e.target.value)}>
                {AUDIENCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-300">Estilos musicales</p>
                <div className="flex flex-wrap gap-2">
                  {MUSIC_OPTIONS.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleEventProfileMusicStyle(style)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        eventProfileMusic.includes(style)
                          ? 'bg-brand-500 text-white'
                          : 'bg-white/10 text-slate-300 hover:bg-white/15'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
              <textarea className="input min-h-32" placeholder="Descripcion de la fiesta, publico y propuesta" value={eventProfileDescription} onChange={(e) => setEventProfileDescription(e.target.value)} />
              <input className="input" placeholder="Instagram" value={eventProfileInstagramUrl} onChange={(e) => setEventProfileInstagramUrl(e.target.value)} />
              <input className="input" placeholder="TikTok" value={eventProfileTiktokUrl} onChange={(e) => setEventProfileTiktokUrl(e.target.value)} />
              <input className="input" placeholder="Web o entradas" value={eventProfileWebsiteUrl} onChange={(e) => setEventProfileWebsiteUrl(e.target.value)} />
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100">
                <input type="checkbox" checked={eventProfileActive} onChange={(e) => setEventProfileActive(e.target.checked)} />
                Fiesta activa
              </label>
              <button className="btn-primary w-full" type="submit" disabled={saving}>
                {saving ? 'Guardando...' : editingEventProfileId ? 'Actualizar fiesta' : 'Crear fiesta'}
              </button>
              {eventProfileMessage && <p className="text-sm text-brand-500">{eventProfileMessage}</p>}
            </form>

            <section id="event-profiles-list" className="card order-1 scroll-mt-24 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Mis fiestas</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Cada fiesta tendra sus propios eventos y contadores.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetEventProfileForm()
                    window.setTimeout(() => {
                      document.getElementById('create-event-profile-form')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      })
                    }, 50)
                  }}
                  className="shrink-0 text-sm font-bold text-brand-500 hover:underline"
                >
                  Crear fiesta
                </button>
              </div>
              {eventProfiles.length === 0 && <p className="mt-6 text-slate-400">Aun no tienes fiestas creadas.</p>}
              <div className="mt-6 space-y-4">
                {eventProfiles.map((profile) => {
                  const profileEvents = events.filter((event) => event.event_profile_id === profile.id)
                  const profileApproved = profileEvents.filter((event) => event.status === 'approved')
                  const profilePending = profileEvents.filter((event) => event.status === 'pending')

                  return (
                    <div key={profile.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      {profile.banner_url && <img src={profile.banner_url} alt="" className="h-28 w-full object-cover" />}
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-900">
                            {profile.logo_url ? (
                              <img src={profile.logo_url} alt={profile.name} className="h-full w-full object-cover" />
                            ) : (
                              <Tags className="h-6 w-6 text-brand-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-semibold text-white">{profile.name}</h3>
                            <p className="mt-1 text-xs text-slate-500">
                              {[profile.venue_name, profile.municipality, profile.audience].filter(Boolean).join(' · ')}
                            </p>
                            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                              <div className="rounded-xl bg-white/5 p-2">
                                <p className="text-lg font-black text-white">{profileEvents.length}</p>
                                <p className="text-slate-400">Total</p>
                              </div>
                              <div className="rounded-xl bg-white/5 p-2">
                                <p className="text-lg font-black text-emerald-400">{profileApproved.length}</p>
                                <p className="text-slate-400">Aprobados</p>
                              </div>
                              <div className="rounded-xl bg-white/5 p-2">
                                <p className="text-lg font-black text-yellow-300">{profilePending.length}</p>
                                <p className="text-slate-400">Pendientes</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => enterEventProfile(profile)}
                            className="rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600"
                          >
                            Entrar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              editEventProfile(profile)
                              window.setTimeout(() => {
                                document.getElementById('create-event-profile-form')?.scrollIntoView({
                                  behavior: 'smooth',
                                  block: 'start',
                                })
                              }, 50)
                            }}
                            className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteEventProfile(profile.id)}
                            className="rounded-full border border-white/10 p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                            aria-label="Borrar fiesta"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </section>
        )}

        {showResources && (
          <section className="space-y-6 px-5">
            <div className="card p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">
                Recursos para promotores
              </p>
              <h2 className="mt-2 text-3xl font-bold">Haz que tu tardeo destaque</h2>
              <p className="mt-3 max-w-3xl text-slate-400">
                Aqui podras contratar espacios destacados en la web, app y redes sociales. De momento queda preparado como escaparate comercial.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title: 'Destacado web',
                  price: 'Desde 49 EUR',
                  text: 'Aparece en seleccion editorial y en posiciones preferentes del buscador.',
                  icon: LayoutDashboard,
                },
                {
                  title: 'Push app',
                  price: 'Proximamente',
                  text: 'Campanas para usuarios que encajen por edad, ciudad y gustos musicales.',
                  icon: Sparkles,
                },
                {
                  title: 'Redes sociales',
                  price: 'Desde 79 EUR',
                  text: 'Apoyo en publicaciones, stories y recomendaciones segmentadas.',
                  icon: Megaphone,
                },
                {
                  title: 'Pack completo',
                  price: 'A medida',
                  text: 'Web, app y redes coordinadas para fechas clave o lanzamientos.',
                  icon: BadgeEuro,
                },
              ].map((resource) => {
                const Icon = resource.icon
                return (
                  <article key={resource.title} className="card flex min-h-64 flex-col justify-between p-6">
                    <div>
                      <Icon className="h-7 w-7 text-brand-500" />
                      <h3 className="mt-5 text-xl font-bold">{resource.title}</h3>
                      <p className="mt-2 text-sm font-semibold text-slate-200">{resource.price}</p>
                      <p className="mt-4 text-sm text-slate-400">{resource.text}</p>
                    </div>
                    <button type="button" className="btn-secondary mt-6 w-full">
                      Solicitar informacion
                    </button>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {panelMode === 'events' && profileComplete && eventView === 'chat' && (
          <section className="px-5 pb-10">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-brand-500" />
              <h2 className="mt-4 text-2xl font-bold text-white">
                Chat con usuarios y TARDEA
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
                Aqui centralizaremos conversaciones sobre reservas, dudas de eventos
                y campanas cuando activemos la parte de mensajeria.
              </p>
            </div>
          </section>
        )}

        {panelMode === 'events' && profileComplete && eventView !== 'chat' && (
          <>
            {false && selectedEventProfile && (
              <section className="px-5 pb-6">
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                  {selectedEventProfile.banner_url && (
                    <img
                      src={selectedEventProfile.banner_url}
                      alt=""
                      className="h-36 w-full object-cover"
                    />
                  )}
                  <div className="p-5">
                    <button
                      type="button"
                      onClick={() => {
                        setPanelMode('brands')
                        setEventView('all')
                      }}
                      className="text-sm font-semibold text-brand-500 hover:underline"
                    >
                      ← Volver a mis fiestas
                    </button>
                    <div className="mt-4 flex items-start gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-900">
                        {selectedEventProfile.logo_url ? (
                          <img
                            src={selectedEventProfile.logo_url}
                            alt={selectedEventProfile.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Tags className="h-7 w-7 text-brand-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-3xl font-black text-white">
                          {selectedEventProfile.name}
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                          {[selectedEventProfile.venue_name, selectedEventProfile.municipality, selectedEventProfile.audience].filter(Boolean).join(' · ')}
                        </p>
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="rounded-xl bg-slate-950/60 p-3">
                            <p className="text-xl font-black text-white">{scopedEvents.length}</p>
                            <p className="text-slate-400">Total</p>
                          </div>
                          <div className="rounded-xl bg-slate-950/60 p-3">
                            <p className="text-xl font-black text-emerald-400">{approvedEvents.length}</p>
                            <p className="text-slate-400">Aprobados</p>
                          </div>
                          <div className="rounded-xl bg-slate-950/60 p-3">
                            <p className="text-xl font-black text-yellow-300">{pendingEvents.length}</p>
                            <p className="text-slate-400">Pendientes</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className={`grid gap-8 px-5 ${eventView === 'all' ? 'lg:grid-cols-[0.9fr_1.1fr]' : ''}`}>
              {eventView === 'all' && (
              <form onSubmit={handleSubmit} className="card space-y-6 p-6">
                <div>
                  <h2 className="text-2xl font-bold">Crear evento</h2>
                  <p className="mt-2 text-sm text-slate-400">
                    {selectedEventProfile
                      ? `Este evento quedara asociado a ${selectedEventProfile.name}.`
                      : 'El evento se enviara como pendiente para revision.'}
                  </p>
                </div>

                {!selectedEventProfile && eventProfiles.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-300">
                      Asociar a una fiesta
                    </p>
                    <select
                      className="select"
                      value={selectedEventProfileId}
                      onChange={(e) => applyEventProfileToEvent(e.target.value)}
                    >
                      <option value="">Evento suelto</option>
                      {eventProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {false && templates.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-300">
                      Usar ficha guardada
                    </p>
                    <select
                      className="select"
                      value={selectedTemplateId}
                      onChange={(e) => applyTemplateToEvent(e.target.value)}
                    >
                      <option value="">Rellenar manualmente</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <input className="input" placeholder="Nombre del evento" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <select className="select" value={type} onChange={(e) => setType(e.target.value)} required>
                  <option value="">Tipo de evento</option>
                  <option>Tardeo</option>
                  <option>Rooftop</option>
                  <option>Brunch</option>
                  <option>Fitness Party</option>
                  <option>Afterwork</option>
                </select>
                <select className="select" value={audience} onChange={(e) => setAudience(e.target.value)} required>
                  <option value="">Edad recomendada</option>
                  {AUDIENCE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <p className="mb-3 text-sm font-semibold text-slate-300">Estilos musicales</p>
                  <div className="flex flex-wrap gap-2">
                    {MUSIC_OPTIONS.map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => toggleMusicStyle(style)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          music.includes(style)
                            ? 'bg-brand-500 text-white'
                            : 'bg-white/10 text-slate-300 hover:bg-white/15'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
                <select className="select" value={area} onChange={(e) => setArea(e.target.value)} required>
                  <option value="">Zona</option>
                  <option>Centro</option>
                  <option>Salamanca</option>
                  <option>Retiro</option>
                  <option value="Otra">Otra</option>
                </select>
                {area === 'Otra' && <input className="input" placeholder="Zona personalizada" value={customArea} onChange={(e) => setCustomArea(e.target.value)} required />}
                <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required />
                <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100">
                  <input type="checkbox" checked={isInvitation} onChange={(e) => { setIsInvitation(e.target.checked); if (e.target.checked) setPriceFrom('') }} />
                  Entrada con invitacion
                </label>
                {!isInvitation && <input className="input" type="number" min="0" placeholder="Precio desde" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} />}
                <input className="input" placeholder="Lugar" value={venue} onChange={(e) => setVenue(e.target.value)} required />
                <input className="input" placeholder="Direccion" value={address} onChange={(e) => setAddress(e.target.value)} required />
                <input className="input" placeholder="Link de Google Maps" value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} />
                <textarea className="input min-h-32" placeholder="Descripcion" value={description} onChange={(e) => setDescription(e.target.value)} required />
                <input className="input" placeholder="Extras separados por comas" value={perks} onChange={(e) => setPerks(e.target.value)} />
                <input type="file" accept="image/*" className="input" onChange={(e) => { const file = e.target.files?.[0] || null; setCover(file); setPreviewUrl(file ? URL.createObjectURL(file) : '') }} />
                {previewUrl && <img src={previewUrl} alt="Preview del evento" className="h-56 w-full rounded-xl object-cover" />}

                <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <button
                    type="button"
                    onClick={() => setPromotionOpen((open) => !open)}
                    className="flex w-full items-center justify-between gap-4 text-left"
                  >
                    <span>
                      <span className="block text-sm font-bold text-white">Promocionar evento</span>
                      <span className="mt-1 block text-xs text-slate-400">
                        Solicita destacado, redes sociales o newsletter. El pago se activara en el siguiente paso.
                      </span>
                    </span>
                    <span className="text-sm font-bold text-brand-500">
                      {promotionOpen ? 'Cerrar' : 'Abrir'}
                    </span>
                  </button>

                  {promotionOpen && (
                    <div className="mt-4 grid gap-3">
                      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                        <input
                          type="radio"
                          name="promotion-package"
                          checked={selectedPromotionPackage === ''}
                          onChange={() => setSelectedPromotionPackage('')}
                          className="mt-1"
                        />
                        <span>
                          <span className="block text-sm font-bold text-white">Sin promocion</span>
                          <span className="block text-xs text-slate-400">Enviar como evento normal.</span>
                        </span>
                      </label>

                      {PROMOTION_PACKAGES.map((promotionPackage) => (
                        <label
                          key={promotionPackage.id}
                          className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                        >
                          <input
                            type="radio"
                            name="promotion-package"
                            checked={selectedPromotionPackage === promotionPackage.id}
                            onChange={() => setSelectedPromotionPackage(promotionPackage.id)}
                            className="mt-1"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-3">
                              <span className="text-sm font-bold text-white">{promotionPackage.name}</span>
                              <span className="text-sm font-black text-brand-500">{promotionPackage.price} EUR</span>
                            </span>
                            <span className="mt-1 block text-xs text-slate-400">
                              {promotionPackage.description}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {false && (
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100">
                  <input
                    type="checkbox"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  />
                  Guardar estos datos como ficha para proximos eventos
                </label>
                )}
                {saveAsTemplate && (
                  <input
                    className="input"
                    placeholder="Nombre de la ficha"
                    value={saveAsTemplateName}
                    onChange={(e) => setSaveAsTemplateName(e.target.value)}
                  />
                )}
                <button className="btn-primary w-full" type="submit" disabled={saving}>
                  {saving ? 'Enviando...' : 'Enviar evento a revision'}
                </button>
                {message && <p className="text-sm text-brand-500">{message}</p>}
              </form>
              )}

              <section className="card p-6">
                <h2 className="text-2xl font-bold">{eventsListTitle}</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {eventView === 'all'
                    ? 'Aqui veras los eventos enviados y su estado.'
                    : 'Aqui veras solo los eventos de esta categoria.'}
                </p>
                {visibleEvents.length === 0 && <p className="mt-6 text-slate-400">{emptyEventsMessage}</p>}
                <div className="mt-6 space-y-4">
                  {visibleEvents.map((event) => (
                    <div key={event.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <p className="mt-1 text-sm text-slate-400">{event.date ? new Date(event.date).toLocaleDateString('es-ES') : 'Sin fecha'}</p>
                        <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs ${event.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                          {event.status === 'approved' ? 'Publicado' : 'Pendiente'}
                        </span>
                        {event.promotion_package_name && (
                          <span className="ml-2 mt-2 inline-block rounded-full bg-brand-500/20 px-3 py-1 text-xs text-brand-200">
                            Promo: {event.promotion_package_name}
                          </span>
                        )}
                      </div>
                      <a href={`/eventos/${event.slug}?from=dashboard`} className="text-sm font-medium text-brand-500 hover:underline">Vista previa</a>
                    </div>
                  ))}
                </div>
              </section>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
