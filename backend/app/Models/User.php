<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['username', 'name', 'email', 'password', 'role', 'barcode', 'is_active'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Definire Roluri SmartQMA (Română / Tehnic)
     */
    public const ROLE_OWNER = 'owner';
    public const ROLE_DIRECTOR = 'director';
    public const ROLE_ENGINEER = 'engineer';
    public const ROLE_OPERATOR = 'operator';
    public const ROLE_PRODUCTION = 'production'; // alias retrocompatibilitate pentru operator
    public const ROLE_MAGAZIONER = 'magazioner';
    public const ROLE_ANALIST_CALITATE = 'analist_calitate';

    public const ROLES = [
        self::ROLE_OWNER,
        self::ROLE_DIRECTOR,
        self::ROLE_ENGINEER,
        self::ROLE_OPERATOR,
        self::ROLE_PRODUCTION,
        self::ROLE_MAGAZIONER,
        self::ROLE_ANALIST_CALITATE,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function isOperator(): bool
    {
        return $this->role === self::ROLE_OPERATOR || $this->role === self::ROLE_PRODUCTION;
    }

    public function isProduction(): bool
    {
        return $this->isOperator();
    }

    public function isEngineer(): bool
    {
        return $this->role === self::ROLE_ENGINEER;
    }

    public function isDirector(): bool
    {
        return $this->role === self::ROLE_DIRECTOR;
    }

    public function isOwner(): bool
    {
        return $this->role === self::ROLE_OWNER;
    }

    public function isMagazioner(): bool
    {
        return $this->role === self::ROLE_MAGAZIONER;
    }

    public function isAnalistCalitate(): bool
    {
        return $this->role === self::ROLE_ANALIST_CALITATE;
    }

    public function stationAccesses(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(UserStationAccess::class);
    }

    /**
     * Verifica daca utilizatorul are dreptul sa acceseze un post de lucru specific
     */
    public function canAccessWorkstation(string $stationSlug): bool
    {
        if ($this->isOwner() || $this->isDirector()) {
            return true;
        }

        if ($this->isEngineer()) {
            return in_array($stationSlug, ['qr-laser', 'smd', 'aoi', 'tht', 'ict', 'eol', 'export', 'plm', 'magazie', 'receptie-marfa'], true);
        }

        if ($this->isMagazioner()) {
            return in_array($stationSlug, ['magazie', 'receptie-marfa', 'plm'], true);
        }

        if ($this->isAnalistCalitate()) {
            return in_array($stationSlug, ['magazie', 'receptie-marfa', 'plm'], true);
        }

        if ($this->isOperator()) {
            return in_array($stationSlug, ['qr-laser', 'smd', 'aoi', 'tht', 'ict', 'eol', 'export'], true);
        }

        return false;
    }
}
