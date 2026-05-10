"""Password hashing and RSA signing utilities for CertVerify."""

from __future__ import annotations

import base64
import hashlib

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.asymmetric.utils import Prehashed


def hash_password(plain_password: str) -> str:
    """Hash a password using SHA-256 + bcrypt workaround for passlib 72-byte limit."""
    try:
        from passlib.context import CryptContext
        # Pre-hash with SHA-256 to keep under 72 bytes, then base64 encode
        pre_hashed = base64.b64encode(
            hashlib.sha256(plain_password.encode("utf-8")).digest()
        ).decode("utf-8")
        _pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return _pwd_context.hash(pre_hashed)
    except Exception:
        # Ultimate fallback using bcrypt directly
        import bcrypt
        pre_hashed = base64.b64encode(
            hashlib.sha256(plain_password.encode("utf-8")).digest()
        ).decode("utf-8")
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(pre_hashed.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    try:
        from passlib.context import CryptContext
        pre_hashed = base64.b64encode(
            hashlib.sha256(plain_password.encode("utf-8")).digest()
        ).decode("utf-8")
        _pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return _pwd_context.verify(pre_hashed, hashed_password)
    except Exception:
        import bcrypt
        pre_hashed = base64.b64encode(
            hashlib.sha256(plain_password.encode("utf-8")).digest()
        ).decode("utf-8")
        return bcrypt.checkpw(pre_hashed.encode("utf-8"), hashed_password.encode("utf-8"))


def compute_file_hash(file_bytes: bytes) -> str:
    """Compute SHA-256 hash of file bytes."""
    return hashlib.sha256(file_bytes).hexdigest()


def generate_rsa_keypair() -> tuple[str, str]:
    """Generate RSA-2048 key pair. Returns (private_pem, public_pem)."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("utf-8")
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("utf-8")
    return private_pem, public_pem


def sign_hash(hash_hex: str, private_key_pem: str) -> str:
    """Sign a hash hex string with RSA private key. Returns base64 signature."""
    private_key = serialization.load_pem_private_key(
        private_key_pem.encode("utf-8"), password=None
    )
    hash_bytes = bytes.fromhex(hash_hex)
    signature = private_key.sign(
        hash_bytes,
        padding.PKCS1v15(),
        Prehashed(hashes.SHA256()),
    )
    return base64.b64encode(signature).decode("utf-8")


def verify_signature(hash_hex: str, signature_b64: str, public_key_pem: str) -> bool:
    """Verify RSA signature. Returns True if valid."""
    try:
        public_key = serialization.load_pem_public_key(
            public_key_pem.encode("utf-8")
        )
        hash_bytes = bytes.fromhex(hash_hex)
        signature = base64.b64decode(signature_b64)
        public_key.verify(
            signature,
            hash_bytes,
            padding.PKCS1v15(),
            Prehashed(hashes.SHA256()),
        )
        return True
    except Exception:
        return False