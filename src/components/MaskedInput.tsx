import React from 'react';
import InputMask from 'react-input-mask';

interface MaskedInputProps {
  mask: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  name?: string;
}

export const MaskedInput: React.FC<MaskedInputProps> = ({
  mask,
  value,
  onChange,
  placeholder,
  className = '',
  name,
}) => {
  return (
    <InputMask
      mask={mask}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      name={name}
    />
  );
};

export const CPFInput: React.FC<Omit<MaskedInputProps, 'mask'>> = (props) => (
  <MaskedInput mask="999.999.999-99" {...props} />
);

export const CNPJInput: React.FC<Omit<MaskedInputProps, 'mask'>> = (props) => (
  <MaskedInput mask="99.999.999/9999-99" {...props} />
);

function formatarCpfCnpj(digitos: string): string {
  if (digitos.length <= 11) {
    let out = digitos.slice(0, 3);
    if (digitos.length > 3) out += '.' + digitos.slice(3, 6);
    if (digitos.length > 6) out += '.' + digitos.slice(6, 9);
    if (digitos.length > 9) out += '-' + digitos.slice(9, 11);
    return out;
  }
  let out = digitos.slice(0, 2);
  out += '.' + digitos.slice(2, 5);
  out += '.' + digitos.slice(5, 8);
  out += '/' + digitos.slice(8, 12);
  if (digitos.length > 12) out += '-' + digitos.slice(12, 14);
  return out;
}

/**
 * Campo único de CPF/CNPJ. Não usa react-input-mask aqui de propósito: a lib trava a
 * digitação no tamanho fixo da máscara atual, então trocar de máscara CPF -> CNPJ no meio
 * da digitação (ao passar de 11 pra 12 dígitos) bloquearia o próprio dígito que dispararia
 * a troca. Formata "na mão" a cada tecla, sem esse limite.
 */
export const CPFCNPJInput: React.FC<Omit<MaskedInputProps, 'mask'>> = ({
  value,
  onChange,
  placeholder,
  className = '',
  name,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitos = e.target.value.replace(/\D/g, '').slice(0, 14);
    e.target.value = formatarCpfCnpj(digitos);
    onChange(e);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      placeholder={placeholder ?? 'CPF ou CNPJ'}
      className={className}
      name={name}
    />
  );
};

export const PhoneInput: React.FC<Omit<MaskedInputProps, 'mask'>> = (props) => (
  <MaskedInput mask="(99) 99999-9999" {...props} />
);

export const CEPInput: React.FC<Omit<MaskedInputProps, 'mask'>> = (props) => (
  <MaskedInput mask="99999-999" {...props} />
);

export const DateInput: React.FC<Omit<MaskedInputProps, 'mask'>> = (props) => (
  <MaskedInput mask="99/99/9999" {...props} />
);
