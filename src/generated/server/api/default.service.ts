/**
 * Favorite Color API
 * API for managing favorite colors
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */

import { Injectable, Optional } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Observable, from, of, switchMap } from 'rxjs';
import { ColorRecordArrayResponse } from '../model/colorRecordArrayResponse';
import { ColorRecordResponse } from '../model/colorRecordResponse';
import { ColorSubmission } from '../model/colorSubmission';
import { ErrorResponse } from '../model/errorResponse';
import { Configuration } from '../configuration';
import { COLLECTION_FORMATS } from '../variables';


@Injectable()
export class DefaultService {

    protected basePath = 'https://default.execute-api.us-east-1.amazonaws.com/dev';
    public defaultHeaders: Record<string,string> = {};
    public configuration = new Configuration();
    protected httpClient: HttpService;

    constructor(httpClient: HttpService, @Optional() configuration: Configuration) {
        this.configuration = configuration || this.configuration;
        this.basePath = configuration?.basePath || this.basePath;
        this.httpClient = configuration?.httpClient || httpClient;
    }

    /**
     * @param consumes string[] mime-types
     * @return true: consumes contains 'multipart/form-data', false: otherwise
     */
    private canConsumeForm(consumes: string[]): boolean {
        const form = 'multipart/form-data';
        return consumes.includes(form);
    }

    /**
     * Search colors by first name
     * 
     * @param firstName First name to search for
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param {*} [getColorsOpts.config] Override http request option.
     */
    public getColors(firstName: string, getColorsOpts?: { config?: AxiosRequestConfig }): Observable<AxiosResponse<ColorRecordArrayResponse>>;
    public getColors(firstName: string, getColorsOpts?: { config?: AxiosRequestConfig }): Observable<any> {
        if (firstName === null || firstName === undefined) {
            throw new Error('Required parameter firstName was null or undefined when calling getColors.');
        }

        let queryParameters = new URLSearchParams();
        if (firstName !== undefined && firstName !== null) {
            queryParameters.append('firstName', <any>firstName);
        }

        let headers = {...this.defaultHeaders};

        let accessTokenObservable: Observable<any> = of(null);

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers['Accept'] = httpHeaderAcceptSelected;
        }

        // to determine the Content-Type header
        const consumes: string[] = [
        ];
        return accessTokenObservable.pipe(
            switchMap((accessToken) => {
                if (accessToken) {
                    headers['Authorization'] = `Bearer ${accessToken}`;
                }

                return this.httpClient.get<ColorRecordArrayResponse>(`${this.basePath}/colors`,
                    {
                        params: queryParameters,
                        withCredentials: this.configuration.withCredentials,
                        ...getColorsOpts?.config,
                        headers: {...headers, ...getColorsOpts?.config?.headers},
                    }
                );
            })
        );
    }
    /**
     * CORS preflight request
     * 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param {*} [optionsColorsOpts.config] Override http request option.
     */
    public optionsColors(optionsColorsOpts?: { config?: AxiosRequestConfig }): Observable<AxiosResponse<any>>;
    public optionsColors(optionsColorsOpts?: { config?: AxiosRequestConfig }): Observable<any> {
        let headers = {...this.defaultHeaders};

        let accessTokenObservable: Observable<any> = of(null);

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers['Accept'] = httpHeaderAcceptSelected;
        }

        // to determine the Content-Type header
        const consumes: string[] = [
        ];
        return accessTokenObservable.pipe(
            switchMap((accessToken) => {
                if (accessToken) {
                    headers['Authorization'] = `Bearer ${accessToken}`;
                }

                return this.httpClient.request<any>({
                    method: 'OPTIONS',
                    url: `${this.basePath}/colors`,
                    withCredentials: this.configuration.withCredentials,
                    ...optionsColorsOpts?.config,
                    headers: {...headers, ...optionsColorsOpts?.config?.headers}
                });
            })
        );
    }
    /**
     * Submit a new favorite color
     * 
     * @param colorSubmission 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     * @param {*} [postColorsOpts.config] Override http request option.
     */
    public postColors(colorSubmission: ColorSubmission, postColorsOpts?: { config?: AxiosRequestConfig }): Observable<AxiosResponse<ColorRecordResponse>>;
    public postColors(colorSubmission: ColorSubmission, postColorsOpts?: { config?: AxiosRequestConfig }): Observable<any> {
        if (colorSubmission === null || colorSubmission === undefined) {
            throw new Error('Required parameter colorSubmission was null or undefined when calling postColors.');
        }

        let headers = {...this.defaultHeaders};

        let accessTokenObservable: Observable<any> = of(null);

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers['Accept'] = httpHeaderAcceptSelected;
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected != undefined) {
            headers['Content-Type'] = httpContentTypeSelected;
        }
        return accessTokenObservable.pipe(
            switchMap((accessToken) => {
                if (accessToken) {
                    headers['Authorization'] = `Bearer ${accessToken}`;
                }

                return this.httpClient.post<ColorRecordResponse>(`${this.basePath}/colors`,
                    colorSubmission,
                    {
                        withCredentials: this.configuration.withCredentials,
                        ...postColorsOpts?.config,
                        headers: {...headers, ...postColorsOpts?.config?.headers},
                    }
                );
            })
        );
    }
}
