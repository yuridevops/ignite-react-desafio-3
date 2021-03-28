import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const product = await api.get<Product>(`/products/${productId}`)

      const findProductIndex = cart.findIndex(element => element.id === productId)
      console.log(findProductIndex)


      if (findProductIndex === -1) {
        const updatedCart = [...cart, {
          ...product.data,
          amount: 1
        }]
        setCart([...updatedCart])

        localStorage.setItem('@RocketShoes:cart',
          JSON.stringify([...updatedCart])
        )
      } else {
        const updatedCart = [...cart]

        const productStock = await api.get<Stock>(`/stock/${productId}`)

        if (productStock.data.amount - (cart[findProductIndex].amount) <= 0)
          throw new Error('Quantidade solicitada fora de estoque');

        updatedCart[findProductIndex].amount += 1
        setCart([...updatedCart])
        localStorage.setItem('@RocketShoes:cart',
          JSON.stringify([...updatedCart])
        )
      }
    } catch (err) {
      if (err.message === 'Quantidade solicitada fora de estoque') {
        toast.error(err.message)
      } else {
        toast.error('Erro na adição do produto');
      }
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const findProductIndex = cart.findIndex(element => element.id === productId)

      if (findProductIndex === -1) {
        throw new Error("Erro na remoção do produto");
      }

      const updatedCart = [...cart]
      updatedCart.splice(findProductIndex, 1)
      setCart([...updatedCart])
      localStorage.setItem('@RocketShoes:cart',
        JSON.stringify([...updatedCart])
      )
    } catch (err) {
      toast.error(err.message);
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      const productStock = await api.get<Stock>(`/stock/${productId}`)

      if (amount > productStock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if (amount < 1) {
      
        return
      }

      const findProductIndex = cart.findIndex(element => element.id === productId)

      if (findProductIndex === -1) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const updatedCart = [...cart]


      updatedCart[findProductIndex].amount = amount
      setCart([...updatedCart])
      localStorage.setItem('@RocketShoes:cart',
        JSON.stringify([...updatedCart])
      )
    } catch (err) {
      toast.error('Erro na alteração de quantidade do produto');

    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
