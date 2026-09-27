import React from 'react';
import {
  Compass,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Clock,
  Users,
  Eye,
  Edit3,
  Copy,
  PauseCircle,
  PlayCircle,
  Trash2,
  ExternalLink,
  Sparkles,
  MapPin,
  Video,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { useProviderWorkspaceStore } from '../../../store/useProviderWorkspaceStore';
import { ProviderExperience } from '../../../types/providerWorkspace';

export function ExperiencesView() {
  const {
    experiences,
    experiencesFilter,
    setExperiencesFilter,
    experiencesSearch,
    setExperiencesSearch,
    setAddExperienceModalOpen,
    setEditingExperience,
    toggleExperienceStatus,
    createExperience,
  } = useProviderWorkspaceStore();

  const filteredExperiences = experiences.filter((exp) => {
    const matchesFilter =
      experiencesFilter === 'all' ||
      exp.status === experiencesFilter ||
      (experiencesFilter === 'published' && exp.is_active);

    const matchesSearch =
      !experiencesSearch ||
      exp.title.toLowerCase().includes(experiencesSearch.toLowerCase()) ||
      exp.city.toLowerCase().includes(experiencesSearch.toLowerCase()) ||
      exp.category.toLowerCase().includes(experiencesSearch.toLowerCase()) ||
      (exp.interests || []).some((i) => i.toLowerCase().includes(experiencesSearch.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const handleDuplicate = async (exp: ProviderExperience) => {
    await createExperience({
      ...exp,
      title: `${exp.title} (Copy)`,
      status: 'draft',
      is_active: false,
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#556275] absolute left-3.5 top-3" />
          <input
            type="text"
            value={experiencesSearch}
            onChange={(e) => setExperiencesSearch(e.target.value)}
            placeholder="Search experiences by title, city, interest or category..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E5DFD5] text-xs font-heading bg-white focus:border-[#C85A32] focus:outline-hidden"
          />
        </div>

        {/* Filter Pills & Add CTA */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {['all', 'published', 'draft', 'paused'].map((status) => (
            <button
              key={status}
              onClick={() => setExperiencesFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold capitalize transition border ${
                experiencesFilter === status
                  ? 'bg-[#12213B] text-white border-[#12213B]'
                  : 'bg-white text-[#556275] border-[#E5DFD5] hover:bg-[#FAF7F2]'
              }`}
            >
              {status}
            </button>
          ))}

          <button
            onClick={() => {
              setEditingExperience(null);
              setAddExperienceModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#C85A32] hover:bg-[#B34D28] text-white rounded-xl text-xs font-heading font-bold transition shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Experience</span>
          </button>
        </div>
      </div>

      {/* Experience Cards Grid */}
      {filteredExperiences.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#E5DFD5] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF4ED] text-[#C85A32] mx-auto flex items-center justify-center">
            <Compass className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-heading font-bold text-[#12213B]">
            No experience listings found
          </h4>
          <p className="text-xs text-[#556275] max-w-sm mx-auto">
            Try adjusting your search query or publish a new high-depth cultural experience with 11 recommendation engine attributes.
          </p>
          <button
            onClick={() => {
              setEditingExperience(null);
              setAddExperienceModalOpen(true);
            }}
            className="px-4 py-2 bg-[#C85A32] text-white rounded-xl text-xs font-heading font-bold"
          >
            Create Your First Experience
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredExperiences.map((exp) => {
            const interestTags = exp.interests && exp.interests.length > 0 ? exp.interests : exp.tags || [];
            const minGuests = exp.min_group_size || 1;
            const maxGuests = exp.max_group_size || exp.max_capacity || 10;
            const operatingDays = exp.operating_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

            return (
              <div
                key={exp.id}
                className="rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs hover:shadow-md transition overflow-hidden flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  {/* Image Cover & Badges */}
                  <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                    <img
                      src={
                        exp.image_url ||
                        exp.image_urls?.[0] ||
                        'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={exp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />

                    {/* Top Left: Category */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="bg-[#12213B]/85 text-white font-mono text-[10px] px-2.5 py-0.5 rounded-full font-bold backdrop-blur-xs">
                        {exp.category}
                      </span>
                    </div>

                    {/* Top Right: Status & Video */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {exp.video_url && (
                        <span className="bg-red-600/90 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                          <Video className="w-2.5 h-2.5" /> Reel
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-mono uppercase font-bold px-2.5 py-0.5 rounded-full backdrop-blur-xs ${
                          exp.status === 'published'
                            ? 'bg-[#ECFDF5]/90 text-[#065F46] border border-[#A7F3D0]'
                            : exp.status === 'draft'
                            ? 'bg-[#FEF3C7]/90 text-[#92400E] border border-[#FDE68A]'
                            : 'bg-gray-100/90 text-gray-700'
                        }`}
                      >
                        {exp.status || 'published'}
                      </span>
                    </div>

                    {/* Bottom Right: Price */}
                    <div className="absolute bottom-3 right-3 bg-white/95 text-[#12213B] font-mono text-xs font-bold px-2.5 py-1 rounded-full shadow-xs">
                      ₹{exp.price} <span className="text-[10px] font-normal text-[#556275]">/ person</span>
                    </div>

                    {/* Bottom Left: Location Landmark */}
                    <div className="absolute bottom-3 left-3 bg-[#12213B]/70 text-white font-heading text-[10px] px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1 max-w-[55%] truncate">
                      <MapPin className="w-2.5 h-2.5 text-[#C85A32] shrink-0" />
                      <span className="truncate">{exp.area_name || exp.city}</span>
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="px-5 pt-1 space-y-2.5">
                    <div>
                      <h3 className="text-sm font-display font-bold text-[#12213B] line-clamp-1 leading-snug">
                        {exp.title}
                      </h3>
                      {exp.tagline && (
                        <p className="text-[11px] text-[#C85A32] line-clamp-1 font-medium italic">
                          "{exp.tagline}"
                        </p>
                      )}
                    </div>

                    <p className="text-xs text-[#556275] line-clamp-2 leading-relaxed">
                      {exp.description}
                    </p>

                    {/* Recommendation Interests Chips */}
                    {interestTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {interestTags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-[#FAF4ED] text-[#C85A32] text-[10px] font-mono font-medium"
                          >
                            #{tag.toLowerCase().replace(/\s+/g, '')}
                          </span>
                        ))}
                        {interestTags.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-mono">
                            +{interestTags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Spec Strip: Duration, Capacity & Group Size */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[#556275] pt-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#C85A32] shrink-0" />
                        <span>{exp.approx_duration_mins || 90}m ({exp.opening_hours || '09:00 - 18:00'})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#12213B] shrink-0" />
                        <span>{minGuests}-{maxGuests} guests ({exp.group_type ? exp.group_type.replace('_', ' ') : 'group'})</span>
                      </div>
                    </div>

                    {/* Accessibility Highlights */}
                    <div className="flex flex-wrap items-center gap-1 text-[10px] text-[#065F46] pt-1">
                      {exp.wheelchair_accessible && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#ECFDF5] border border-[#A7F3D0]">
                          ♿ Wheelchair
                        </span>
                      )}
                      {exp.low_walking && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#ECFDF5] border border-[#A7F3D0]">
                          🚶 Low Walk
                        </span>
                      )}
                      {exp.step_free && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#ECFDF5] border border-[#A7F3D0]">
                          🪜 Step-free
                        </span>
                      )}
                      {exp.audio_guide && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#ECFDF5] border border-[#A7F3D0]">
                          🎧 Audio
                        </span>
                      )}
                      {exp.is_rain_safe && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#ECFDF5] border border-[#A7F3D0]">
                          ☔ Rain-safe
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3 mt-3 border-t border-[#E5DFD5] bg-[#FAF7F2] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingExperience(exp)}
                      className="p-1.5 text-[#556275] hover:text-[#12213B] hover:bg-white rounded-lg transition"
                      title="Edit 11 Recommendation Fields"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDuplicate(exp)}
                      className="p-1.5 text-[#556275] hover:text-[#12213B] hover:bg-white rounded-lg transition"
                      title="Duplicate Listing"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {exp.status === 'published' ? (
                      <button
                        onClick={() => toggleExperienceStatus(exp.id, 'paused')}
                        className="p-1.5 text-[#556275] hover:text-amber-600 hover:bg-white rounded-lg transition"
                        title="Pause Listing"
                      >
                        <PauseCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleExperienceStatus(exp.id, 'published')}
                        className="p-1.5 text-[#556275] hover:text-green-600 hover:bg-white rounded-lg transition"
                        title="Publish Listing"
                      >
                        <PlayCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setEditingExperience(exp)}
                    className="flex items-center gap-1 text-xs font-heading font-bold text-[#C85A32] hover:underline"
                  >
                    <span>Manage 11 Factors</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
