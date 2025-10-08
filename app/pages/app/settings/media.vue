<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  title: 'Media Settings'
})

const mediaSchema = z.object({
  media_convert_images: z.boolean(),
  media_convert_videos: z.boolean(),
  media_convert_audio: z.boolean(),
  media_keep_original: z.boolean(),
  media_image_quality: z.number().min(0, 'Quality must be at least 0').max(100, 'Quality cannot exceed 100'),
  media_video_quality: z.number().min(0, 'CRF must be at least 0').max(51, 'CRF cannot exceed 51'),
  media_audio_bitrate: z.number().min(32, 'Bitrate must be at least 32 kbps').max(320, 'Bitrate cannot exceed 320 kbps')
})

type MediaSchema = z.output<typeof mediaSchema>

const settingsStore = useSettingsStore()
const toast = useToast()

const formData = reactive<MediaSchema>({
  media_convert_images: true,
  media_convert_videos: true,
  media_convert_audio: true,
  media_keep_original: false,
  media_image_quality: 85,
  media_video_quality: 23,
  media_audio_bitrate: 96
})

// Computed properties from store
const loading = computed(() => settingsStore.isLoading)
const saving = computed(() => settingsStore.isSaving)
const mediaSettings = computed(() => settingsStore.mediaSettings)

// Watch for settings changes and update form data
watch(mediaSettings, (settings) => {
  settings.forEach(setting => {
    const key = setting.setting_key as keyof MediaSchema
    if (setting.type === 'bool') {
      formData[key] = setting.value_bool as boolean
    } else if (setting.type === 'int') {
      formData[key] = setting.value_int as number
    }
  })
}, { immediate: true })

// Save settings
const saveSettings = async (event: FormSubmitEvent<MediaSchema>) => {
  try {
    await settingsStore.updateMediaSettings(event.data)

    toast.add({
      title: 'Success',
      description: 'Media settings updated successfully',
      color: 'success',
      icon: 'i-lucide-check'
    })
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to update settings: ' + error,
      color: 'error'
    })
  }
}

// Load settings on mount
onMounted(async () => {
  try {
    await settingsStore.fetchSettings()
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to load settings: ' + error,
      color: 'error'
    })
  }
})
</script>

<template>
  <UForm
    id="media-settings"
    :schema="mediaSchema"
    :state="formData"
    @submit="saveSettings"
  >
    <UPageCard
      title="Media Settings"
      description="Configure automatic media conversion, file optimization, and storage options."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        form="media-settings"
        label="Save changes"
        color="primary"
        type="submit"
        :loading="saving"
        :disabled="loading || saving"
        class="w-fit lg:ms-auto"
      />
    </UPageCard>

    <UPageCard v-if="!loading" variant="subtle">
      <!-- Image Conversion -->
      <UFormField
        name="media_convert_images"
        label="Convert Images to WebP"
        description="Automatically convert uploaded images (JPG, PNG) to WebP format for better compression"
        class="flex max-sm:flex-col justify-between sm:items-center gap-4"
      >
        <div class="flex items-center gap-3">
          <USwitch v-model="formData.media_convert_images" />
          <span class="text-sm" :class="formData.media_convert_images ? 'text-green-600 font-medium' : 'text-gray-600'">
            {{ formData.media_convert_images ? 'Enabled' : 'Disabled' }}
          </span>
        </div>
      </UFormField>

      <USeparator />

      <!-- Video Conversion -->
      <UFormField
        name="media_convert_videos"
        label="Convert Videos to WebM"
        description="Automatically convert uploaded videos to WebM format (VP9 + Opus codecs)"
        class="flex max-sm:flex-col justify-between sm:items-center gap-4"
      >
        <div class="flex items-center gap-3">
          <USwitch v-model="formData.media_convert_videos" />
          <span class="text-sm" :class="formData.media_convert_videos ? 'text-green-600 font-medium' : 'text-gray-600'">
            {{ formData.media_convert_videos ? 'Enabled' : 'Disabled' }}
          </span>
        </div>
      </UFormField>

      <USeparator />

      <!-- Audio Conversion -->
      <UFormField
        name="media_convert_audio"
        label="Convert Audio to Opus"
        description="Automatically convert uploaded audio files to Opus format for web optimization"
        class="flex max-sm:flex-col justify-between sm:items-center gap-4"
      >
        <div class="flex items-center gap-3">
          <USwitch v-model="formData.media_convert_audio" />
          <span class="text-sm" :class="formData.media_convert_audio ? 'text-green-600 font-medium' : 'text-gray-600'">
            {{ formData.media_convert_audio ? 'Enabled' : 'Disabled' }}
          </span>
        </div>
      </UFormField>

      <USeparator />

      <!-- Keep Original -->
      <UFormField
        name="media_keep_original"
        label="Keep Original Files"
        description="Store both original and converted files (requires more storage space)"
        class="flex max-sm:flex-col justify-between sm:items-center gap-4"
      >
        <div class="flex items-center gap-3">
          <USwitch v-model="formData.media_keep_original" />
          <span class="text-sm" :class="formData.media_keep_original ? 'text-yellow-600 font-medium' : 'text-gray-600'">
            {{ formData.media_keep_original ? 'Keeping originals' : 'Using converted only' }}
          </span>
        </div>
      </UFormField>

      <USeparator />

      <!-- Image Quality -->
      <UFormField
        name="media_image_quality"
        label="Image Quality"
        description="WebP quality setting (0-100, recommended 80-90 for best balance)"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <div class="w-full min-w-[300px] space-y-2">
          <div class="flex justify-between text-sm">
            <span>Quality: {{ formData.media_image_quality }}%</span>
            <span class="text-gray-500">{{ formData.media_image_quality < 70 ? 'Lower quality' : formData.media_image_quality < 85 ? 'Good quality' : 'High quality' }}</span>
          </div>
          <UInput
            v-model.number="formData.media_image_quality"
            type="range"
            min="0"
            max="100"
            step="5"
            class="w-full"
          />
        </div>
      </UFormField>

      <USeparator />

      <!-- Video Quality -->
      <UFormField
        name="media_video_quality"
        label="Video Quality (CRF)"
        description="Constant Rate Factor for video encoding (0-51, lower is better, recommended 23-28)"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <div class="w-full min-w-[300px] space-y-2">
          <div class="flex justify-between text-sm">
            <span>CRF: {{ formData.media_video_quality }}</span>
            <span class="text-gray-500">{{ formData.media_video_quality < 20 ? 'Very high quality' : formData.media_video_quality < 28 ? 'Good quality' : 'Lower quality' }}</span>
          </div>
          <UInput
            v-model.number="formData.media_video_quality"
            type="range"
            min="0"
            max="51"
            step="1"
            class="w-full"
          />
        </div>
      </UFormField>

      <USeparator />

      <!-- Audio Bitrate -->
      <UFormField
        name="media_audio_bitrate"
        label="Audio Bitrate"
        description="Audio bitrate in kbps (recommended 96 for speech, 128 for music)"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <div class="relative">
          <UInput
            v-model.number="formData.media_audio_bitrate"
            type="number"
            min="32"
            max="320"
            step="8"
            placeholder="96"
            class="w-full min-w-[300px]"
          />
          <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">kbps</span>
        </div>
      </UFormField>
    </UPageCard>

    <UPageCard v-else variant="subtle">
      <div class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin" />
      </div>
    </UPageCard>

    <!-- Warning for keeping originals -->
    <UAlert
      v-if="formData.media_keep_original && !loading"
      color="warning"
      variant="soft"
      title="Storage Notice"
      description="Keeping original files will double your storage usage for media files. Make sure you have sufficient storage capacity."
      icon="i-lucide-alert-triangle"
      class="mt-6"
    />

    <!-- Information Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-image" class="w-5 h-5" />
            <h4 class="font-semibold">Image Conversion</h4>
          </div>
        </template>
        <div class="space-y-2 text-sm">
          <p><strong>Format:</strong> WebP</p>
          <p><strong>Supports:</strong> JPG, PNG, GIF, BMP</p>
          <p><strong>Benefits:</strong> 25-35% smaller files</p>
          <p><strong>Quality:</strong> {{ formData.media_image_quality }}% compression</p>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-video" class="w-5 h-5" />
            <h4 class="font-semibold">Video Conversion</h4>
          </div>
        </template>
        <div class="space-y-2 text-sm">
          <p><strong>Format:</strong> WebM (VP9 + Opus)</p>
          <p><strong>Supports:</strong> MP4, MOV, AVI, MKV</p>
          <p><strong>Benefits:</strong> Better compression, web-optimized</p>
          <p><strong>CRF:</strong> {{ formData.media_video_quality }} ({{ formData.media_video_quality < 20 ? 'very high' : formData.media_video_quality < 28 ? 'good' : 'lower' }} quality)</p>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-music" class="w-5 h-5" />
            <h4 class="font-semibold">Audio Conversion</h4>
          </div>
        </template>
        <div class="space-y-2 text-sm">
          <p><strong>Format:</strong> Opus</p>
          <p><strong>Supports:</strong> MP3, WAV, FLAC, AAC</p>
          <p><strong>Benefits:</strong> Superior quality at low bitrates</p>
          <p><strong>Bitrate:</strong> {{ formData.media_audio_bitrate }} kbps</p>
        </div>
      </UCard>
    </div>
  </UForm>
</template>
