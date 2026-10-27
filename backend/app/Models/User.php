<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['username', 'name', 'email', 'password', 'role', 'is_active'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Definire Roluri SmartQMA
     */
    public const ROLE_PRODUCTION = 'production';
    public const ROLE_ENGINEER = 'engineer';
    public const ROLE_DIRECTOR = 'director';
    public const ROLE_OWNER = 'owner';

    public const ROLES = [
        self::ROLE_PRODUCTION,
        self::ROLE_ENGINEER,
        self::ROLE_DIRECTOR,
        self::ROLE_OWNER,
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

    public function isProduction(): bool
    {
        return $this->role === self::ROLE_PRODUCTION;
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

    /**
     * Verifica daca utilizatorul are dreptul sa acceseze un post de lucru specific
     */
    public function canAccessWorkstation(string $stationSlug): bool
    {
        if ($this->isOwner() || $this->isDirector()) {
            return true;
        }

        if ($this->isEngineer()) {
            return true;
        }

        // Rolul de productie are acces la statiile operationale, dar nu la statistici agregate executive
        if ($this->isProduction()) {
            return $stationSlug !== 'statistica';
        }

        return false;
    }
}
