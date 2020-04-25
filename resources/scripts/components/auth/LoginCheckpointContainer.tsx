import React from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import loginCheckpoint from '@/api/auth/loginCheckpoint';
import { httpErrorToHuman } from '@/api/http';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { ActionCreator } from 'easy-peasy';
import { StaticContext } from 'react-router';
import Spinner from '@/components/elements/Spinner';
import { useFormikContext, withFormik } from 'formik';
import { object, string } from 'yup';
import useFlash from '@/plugins/useFlash';
import { FlashStore } from '@/state/flashes';
import Field from '@/components/elements/Field';

interface Values {
    code: string;
}

type OwnProps = RouteComponentProps<{}, StaticContext, { token?: string }>

type Props = OwnProps & {
    addError: ActionCreator<FlashStore['addError']['payload']>;
    clearFlashes: ActionCreator<FlashStore['clearFlashes']['payload']>;
}

const LoginCheckpointContainer = () => {
    const { isSubmitting } = useFormikContext<Values>();

    return (
        <LoginFormContainer
            title={'Device Checkpoint'}
            className={'w-full flex'}
        >
            <div className={'mt-6'}>
                <Field
                    light={true}
                    name={'code'}
                    title={'Authentication Code'}
                    description={'Enter the two-factor token generated by your device.'}
                    type={'number'}
                    autoFocus={true}
                />
            </div>
            <div className={'mt-6'}>
                <button
                    type={'submit'}
                    className={'btn btn-primary btn-jumbo'}
                    disabled={isSubmitting}
                >
                    {isSubmitting ?
                        <Spinner size={'tiny'} className={'mx-auto'}/>
                        :
                        'Continue'
                    }
                </button>
            </div>
            <div className={'mt-6 text-center'}>
                <Link
                    to={'/auth/login'}
                    className={'text-xs text-neutral-500 tracking-wide uppercase no-underline hover:text-neutral-700'}
                >
                    Return to Login
                </Link>
            </div>
        </LoginFormContainer>
    );
};

const EnhancedForm = withFormik<Props, Values>({
    handleSubmit: ({ code }, { setSubmitting, props: { addError, clearFlashes, location } }) => {
        clearFlashes();
        console.log(location.state.token, code);
        loginCheckpoint(location.state?.token || '', code)
            .then(response => {
                if (response.complete) {
                    // @ts-ignore
                    window.location = response.intended || '/';
                    return;
                }

                setSubmitting(false);
            })
            .catch(error => {
                console.error(error);
                setSubmitting(false);
                addError({ message: httpErrorToHuman(error) });
            });
    },

    mapPropsToValues: () => ({
        code: '',
    }),

    validationSchema: object().shape({
        code: string().required('An authentication code must be provided.')
            .length(6, 'Authentication code must be 6 digits in length.'),
    }),
})(LoginCheckpointContainer);

export default ({ history, location, ...props }: OwnProps) => {
    const { addError, clearFlashes } = useFlash();

    if (!location.state?.token) {
        history.replace('/auth/login');

        return null;
    }

    return <EnhancedForm
        addError={addError}
        clearFlashes={clearFlashes}
        history={history}
        location={location}
        {...props}
    />;
};
