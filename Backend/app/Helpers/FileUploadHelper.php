<?php

namespace App\Helpers;

use Bunny\Storage\Client;
use Bunny\Storage\Region;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class FileUploadHelper
{
    /**
     * Upload file to public storage
     *
     * @param UploadedFile|null $file
     * @param string $path
     * @return string|null
     */

    // public static function uploadFile(?UploadedFile $file, string $path = 'uploads'): ?string
    // {
    //     $bunnycdnApiKey = config('services.bunnycdn.api_key');
    //     $bunnycdnStorageZone = config('services.bunnycdn.storage_zone');
        
    //     $client = new Client(
    //         $bunnycdnApiKey,
    //         $bunnycdnStorageZone,
    //         Region::SINGAPORE
    //     );

    //     if ($file) {
    //         $manager = new ImageManager(new Driver());
    //         $extension  = strtolower($file->getClientOriginalExtension());
    //         $filename = uniqid() . '.' . $file->getClientOriginalExtension();
    //         $remotePath = trim($path, '/') . '/' . $filename;
    //         $tempPath = tempnam(sys_get_temp_dir(), 'upload_');
    //         //Compress only if supported image
    //         if (in_array($extension, ['jpg', 'jpeg', 'png', 'webp'])) {
    //             $image = $manager->read($file->getRealPath());
    //             $encoded = match ($extension) {
    //                 'jpg', 'jpeg' => $image->toJpeg(quality: 75),
    //                 'webp'        => $image->toWebp(quality: 75),
    //                 'png'         => $image->toPng(),
    //             };
    //             $encoded->save($tempPath);
    //         } else {
    //             // Not an image → upload original file
    //             copy($file->getRealPath(), $tempPath);
    //         }
    //         $client->upload($tempPath, $remotePath);
    //         unlink($tempPath);
    //         return $remotePath; 
    //         // $filePath = Storage::disk('bunny')->put(
    //         //     $path,
    //         // $file
    //         // );
    //         // return $filePath;
    //         // $fileName = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
    //         // $filePath = $file->storeAs($path, $fileName, 'public');
    //         // return '/storage/' . $filePath;
    //     }
    //     return null;
    // }

  public static function uploadFile(?UploadedFile $file, string $path = 'uploads'): ?string
{
    if (!$file) return null;

    // 1. Initialize BunnyCDN Client
    $client = new Client(
        config('services.bunnycdn.api_key'),
        config('services.bunnycdn.storage_zone'),
        Region::SINGAPORE
    );

    $manager = new ImageManager(new Driver());
    $originalExtension = strtolower($file->getClientOriginalExtension());
    $originalSize = $file->getSize(); 
    $tempPath = tempnam(sys_get_temp_dir(), 'upload_');
    
    $imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    $compressedSize = 0;

    try {
        if (in_array($originalExtension, $imageExtensions)) {
            // Force filename to .webp
            $filename = uniqid() . '.webp';
            
            // Read and Convert
            $image = $manager->read($file->getRealPath());
            $encoded = $image->toWebp(quality: 75);
            
            // Measure size from the encoded string to avoid 0 KB cache issues
            $compressedSize = strlen((string) $encoded);
            
            // Save to temp file
            $encoded->save($tempPath);
        } else {
            // Not a supported image: keep original extension and copy
            $filename = uniqid() . '.' . $originalExtension;
            copy($file->getRealPath(), $tempPath);
            
            // Refresh PHP's file stats for this specific path
            clearstatcache(true, $tempPath);
            $compressedSize = filesize($tempPath);
        }

        $remotePath = trim($path, '/') . '/' . $filename;

        // 2. Log the Stats
        // self::logCompressionStats($file->getClientOriginalName(), $originalSize, $compressedSize);

        // 3. Upload to Bunny
        $client->upload($tempPath, $remotePath);

        return $remotePath;

    } catch (\Exception $e) {
        Log::error("File Upload Failed: " . $e->getMessage());
        return null;
    } finally {
        // 4. Always clean up the temp file
        if (file_exists($tempPath)) {
            unlink($tempPath);
        }
    }
}

/**
 * Calculates and logs the space saved
 */
private static function logCompressionStats(string $name, int $original, int $compressed): void
{
    $saved = $original - $compressed;
    $percentage = $original > 0 ? round(($saved / $original) * 100, 2) : 0;

    Log::info("File Upload Compression Stats:", [
        'filename'    => $name,
        'original'    => round($original / 1024, 2) . ' KB',
        'compressed'  => round($compressed / 1024, 2) . ' KB',
        'savings'     => $percentage . '%',
    ]);
}

    public static function deleteFile($path)
    {
        if (!$path) return false;

        $relativePath = str_replace(Storage::url(''), '', $path);
        return Storage::disk('public')->delete($relativePath);
    }
}
