/**
 * Created by 이충렬 on 2022-02-28 : init Commit
 * @Param1 {Object} 옵션
 * ex)
 * Option = {
 *        bMulti  : 체크박스 멀티로 체크할 것인지 여부 ex ) true,false , default=false
 *        nMaxCnt : 한번에 보여줄 데이터 갯수, 나머지는 스크롤로 작동 ex) 300
 *  (필수) sTarget : Target Div ID ex) 'eWarehouseSearch'
 *  (필수) sTargetNm : Target Name ex) '창고',
 *  (필수) sKey : Option Data List Key Key ex) 'ft_warehouse.idx',
 *  (필수) sDesr: Option Data List Description Key ex) 'ft_warehouse.name',
 *        bAll : 전체 HTML 표시 여부 ex) true,false , default=true
 *        bSearch : 검색기능 활성화 여부 ex) true,false,  default=false
 *        onChange : 옵션창 닫힐때 실행되는 Function => return 현재 선택된 option idx,
 *        formType : 데이터 서브밋시 형태 ,
 * }
 * @Param2 {Object Array} Option 데이터,
 * @Param3 {Array} 기본 선택값
 *
 */
class MultiSelect {

    constructor(oOpt,aData=[],aDefault=[])
    {
        this.sViewType = 'all';
        this.oOpt = oOpt;
        this.aData = aData;
        this.aDefault = aDefault;
        this.fadeTime = 150;
        this._setMultiSelect(aData, aDefault);
        this._setDocEvent();
        this._setEvent();
    }

    _setMultiSelect(aData=[],aDefault=[])
    {
        let sTarget = this.oOpt['sTarget'];
        let sTargetNm = this.oOpt['sTargetNm'];
        let bSearch = this.oOpt['bSearch'] == undefined ? false : this.oOpt['bSearch'];
        this.nMaxCnt = !this.oOpt['nMaxCnt'] ? null : this.oOpt['nMaxCnt'];
        aDefault = !aDefault ? [] :  aDefault.toString().split(",");
        this.nCurPage = 0;
        this.bOverflow = true;
        let sHtml = `
                <input type="text" ${bSearch ? "" : "readonly" } class="selectedTxt" arync-grid="true" autocomplete="off" placeholder="전체 ${sTargetNm}" />
                <ul class="multiSelect" ></ul>
        `;
        $(`#${sTarget}`).empty().append(sHtml);

        if( this.oOpt['nMaxCnt'] != null ){
            this.nMaxCnt = this.nMaxCnt < 10 ? 50 : this.nMaxCnt;
            this.sViewType = "scroll";
            aData = aData.slice( 0 , this.nMaxCnt );
        }
        this._renderOption( aData , aDefault );

        if( aDefault.length > 0 && this.sViewType == 'scroll' ){
            this._setHideDataChecked(aDefault);
        }

        $(`#${sTarget}`).css("position","relative");
        this._updatePlace();
    };

    _setDocEvent()
    {
        let self = this;
        let sTarget = this.oOpt.sTarget;

        $("form").submit(function(){
            self.setFormData();
        });

        $(document).on("change",".eFilter",function(){
            $(this).removeClass("eFilter");
            self._updatePlace();
        });
        $(document).on("click",`#${sTarget} > .multiSelect > li > label > .fChkAll`,function(){
            let bChk = $(this).is(":checked");
            self.bHiddenDataChecked = bChk;
            $(`#${sTarget} > .multiSelect > li > label > .fChk`).prop('checked',bChk);
            self._updatePlace();
        });
        $(document).on("click",`#${sTarget} > .multiSelect > li > label > .fChk`,function(){
            if( !self.oOpt['bMulti'] ){
                $(`#${sTarget} > .multiSelect > li > label > .fChk`).not( $(this) ).prop('checked',false);
            };
            self._updatePlace();
        });
        $(document).on("keyup",`#${sTarget} > .selectedTxt`,function(e){
            if( e.keyCode!=13 )return false;
            e.preventDefault();
            let sValue = $(this).val();
            sValue = sValue.split(" ").join("")
            $(`#${sTarget} > .multiSelect > li`).show();
            self.bOverflow = true;
            if(!sValue) return false;

            if( self.sViewType == "all"){
                $(`#${sTarget}`).find(".fChk").map(function(i,d){
                    if( ( $(d).attr('data-name') ).indexOf( sValue ) < 0 ) $(d).parents('label').parents('li').hide();
                });
            }
            if( self.sViewType == "scroll"){
                self.bOverflow = false;
                $(`#${sTarget}`).find("li").hide();
                $(`#${sTarget}`).find(".fChkAll").parents('label').parents('li').show();
                self._filterSearchTxt(sValue);
            }
        });

        $(document).on("click",`#${sTarget} > .selectedTxt`,function(e){
            if( $(this).siblings(".multiSelect").css("display") === 'none' ) self.open();
        });

        $(document).on("click",`body`,function(e){
            if( $(e.target).parents(`#${sTarget}`).length > 0 || $(e.target).is(`#${sTarget}`) ){
                return;
            };

            if( $(`#${sTarget}`).find(".multiSelect").is(':visible') ){
                $(`#${sTarget}`).find(".selectedTxt").val(null);
                self.close();
            }
        });
    }

    _setEvent()
    {
        let sTarget = this.oOpt.sTarget;
        let oSelect = $(`#${sTarget}`).find(".multiSelect");
        let self = this;

        oSelect.scroll(function(){
            if( !self.bOverflow ) return false;
            let scrollT = $(this).scrollTop(); //스크롤바의 상단위치
            let scrollH = $(this).innerHeight(); //스크롤바를 갖는 div의 높이
            let contentH = oSelect.prop('scrollHeight'); //문서 전체 내용을 갖는 div의 높이

            if(scrollT + scrollH + 1 >= contentH) { // 스크롤바가 아래 쪽에 위치할 때
                self.nCurPage++;
                let aData = self.aData.slice( (self.nCurPage*self.nMaxCnt) , (self.nCurPage*self.nMaxCnt)+self.nMaxCnt );
                self._addOption( aData );
            }
        });
    }

    _filterSearchTxt(sTxt){

        let sTarget = this.oOpt['sTarget'];
        let sKey    = this.oOpt['sKey'];
        let sDesr   = this.oOpt['sDesr'];

        let aChkAll = $(`#${sTarget}`).find(".fChkAll");
        let bChk = aChkAll.is(":checked");

        this.aData.forEach(function(oData){
            if( (oData[sDesr]).indexOf( sTxt ) < 0 ) return false;
            let sChecked = "";
            if( bChk )sChecked = "checked";
            if( $(`#${sTarget} > .multiSelect > li > label > .fChk[value=${oData[sKey]}]:checked`).length > 0 ) sChecked = "checked";
            $(`#${sTarget} > .multiSelect > li > label > .fChk[value=${oData[sKey]}]`).parents("li").remove();

            let sStr =  `
                        <li>
                            <label>
                                <input ${sChecked} type="checkbox" class="fChk eChkLbl ${sTarget}_chk"
                                        value="${oData[sKey]}" 
                                        data-name="${oData[sDesr]}"
                                        />&nbsp;&nbsp;${oData[sDesr]}
                            </label>
                        </li>
                    `;
            $(`#${sTarget}`).find(".multiSelect").find("li:eq(0)").after( sStr );
        });
    }

    _setHideDataChecked(aDefault){

        let sTarget = this.oOpt['sTarget'];
        let sKey    = this.oOpt['sKey'];
        let sDesr   = this.oOpt['sDesr'];

        this.aData.map(function(oData){
            if( ( aDefault ).indexOf( oData[sKey].toString() ) < 0 ) return false;
            $(`#${sTarget} > .multiSelect > li > label > .fChk[value=${oData[sKey]}]`).parents("li").remove();
            let sStr =  `
                        <li>
                            <label>
                                <input checked type="checkbox" class="fChk eChkLbl ${sTarget}_chk"
                                        value="${oData[sKey]}" 
                                        data-name="${oData[sDesr]}"
                                        />&nbsp;&nbsp;${oData[sDesr]}
                            </label>
                        </li>
                    `;
            $(`#${sTarget}`).find(".multiSelect").find("li:eq(0)").after( sStr );
        });
    }

    _addOption( aData ){
        if( aData.length <= 0 ) return false;
        let sKey    = this.oOpt['sKey'];
        let sDesr   = this.oOpt['sDesr'];
        let sTarget = this.oOpt['sTarget'];
        let aChkAll = $(`#${sTarget}`).find(".fChkAll");
        let bChk = aChkAll.is(":checked");

        bChk = this.bHiddenDataChecked ? true : false;
        aData.forEach(function(oData){
            let sChecked = "";

            if( $(`#${sTarget} > .multiSelect > li > label > .fChk[value=${oData[sKey]}]`).length > 0) return false;
            $(`.s${sTarget}_value[value=${oData[sKey]}]`).remove();

            if( bChk ) sChecked = "checked";
            let sStr =  `
                        <li>
                            <label>
                                <input ${sChecked} type="checkbox" class="fChk eChkLbl ${sTarget}_chk"
                                        value="${oData[sKey]}" 
                                        data-name="${oData[sDesr]}"
                                        />&nbsp;&nbsp;${oData[sDesr]}
                            </label>
                        </li>
                    `;
            $(`#${sTarget}`).find(".multiSelect").append( sStr );
        });
        this._setEvent();
    }

    _renderOption(aData=[] , aDefault=[] )
    {
        let sTargetNm = this.oOpt['sTargetNm'];
        let sKey    = this.oOpt['sKey'];
        let sDesr   = this.oOpt['sDesr'];
        let bAll    = this.oOpt['bAll'] == undefined ? true : this.oOpt['bAll'];
        let sTarget = this.oOpt['sTarget'];
        let bMulti  = this.oOpt['bMulti'] == undefined ? true : this.oOpt['bMulti'];
        this.oOpt['bMulti'] = bMulti;

        let sSelectHtml = bAll ? `<li><label><input type="checkbox" class="fChkAll" value="all" style="width: 14px;height: 14px;" />&nbsp;&nbsp;전체 ${sTargetNm}</label></li>` : "";
        if( !bMulti ){
            sSelectHtml = "";
        }

        if( aData.length == 0 ) sSelectHtml = `<li style="text-align:left;"><label><span>내역이 없습니다</span></label></li>`;
        $(`#${sTarget}`).find(".multiSelect").append( sSelectHtml );

        aData.forEach(function(oData){
            let sChecked = "";
            if(aDefault.length != 0){
                if( aDefault.indexOf( oData[sKey]+"" ) != -1 ) sChecked = "checked";
            }

            let sStr =  `
                        <li>
                            <label>
                                <input ${sChecked} type="checkbox" class="fChk eChkLbl ${sTarget}_chk"
                                        value="${oData[sKey]}" 
                                        data-name="${oData[sDesr]}"
                                        />&nbsp;&nbsp;${oData[sDesr]}
                            </label>
                        </li>
                    `;
            $(`#${sTarget}`).find(".multiSelect").append( sStr );
        });
    }

    async _updatePlace()
    {
        let self = this;
        let sTargetNm = this.oOpt.sTargetNm;
        let oInput  = $(`#${this.oOpt.sTarget}`).find(".selectedTxt");
        let aChk    = $(`#${this.oOpt.sTarget}`).find(".fChk:checked");
        let nCnt    = $(`#${this.oOpt.sTarget}`).find(".fChk").length;

        let sStr = "";
        for(let i=0; i<aChk.length;i++) {
            let oChk = $(`#${this.oOpt.sTarget}`).find(`.fChk:checked:eq(${i})`);
            sStr+= `${oChk.attr("data-name")},`;
            if ( sStr.length > 30) break;
        };
        sStr = sStr.slice(0, -1);
        sStr = sStr.length > 20 ? sStr.slice( 0 , 20)+"..." : sStr;
        let sPlaceholder="";

        let bMulti = self.oOpt['bMulti'];
        let aChkAll = $(`#${this.oOpt.sTarget}`).find(".fChkAll");
        if(aChk.length == 0) {
            this.bChecked = false;
            sPlaceholder = `${sTargetNm}${!this._checkBatchimEnding(sTargetNm) ? "를" : "을"} 선택해주세요.`;
            aChkAll.prop('checked', false);
        }else if( nCnt == aChk.length && bMulti == true ) {
            this.bChecked = true;
            sPlaceholder = `전체 ${sTargetNm}`;
            aChkAll.prop('checked',true);
        }else {
            this.bChecked = false;
            let nCnt = this.getSelectedValue().length;
            sPlaceholder = !this.oOpt['bMulti'] ? `${sStr}${ !this._checkBatchimEnding(sStr) ? "가" : "이" } 선택되었습니다.` : `[총 ${ nCnt }건] ${sStr}`;
            aChkAll.prop('checked',false);
        }



        oInput.attr('placeholder' , sPlaceholder )
    };

    //조사 셋팅 을/를
    _checkBatchimEnding(word)
    {
        if (typeof word !== 'string') return null;
        word = word.charAt(word.length-1);
        let lastLetter = word[word.length - 1];
        let uni = lastLetter.charCodeAt(0);

        if (uni < 44032 || uni > 55203) return null;

        return (uni - 44032) % 28 != 0;
    }

    // Keep Option & Reload SelectList
    reload( aData=[],aDefault=[])
    {
        this.aData = !aData ? [] : aData;
        this.aDefault = !aDefault ? [] : aDefault;
        this._setMultiSelect( aData,aDefault );
        this._setEvent();
    }

    //get Selected Value Array Type
    getSelectedValue()
    {
        let self = this;
        let sTarget = this.oOpt.sTarget;

        if( this.sViewType == 'scroll'){
            let sKey = this.oOpt['sKey'];
            if( this.isAllChecked() ){
                return (this.aData).map(function(oData){
                    return oData[ sKey ];
                });
            }else{
                let aResult = [];
                (this.aData).forEach(function(oData){
                    let bFlag = false;
                    if( $(`.${sTarget}_chk[value='${oData[ sKey ]}']`).length > 0 ){
                        if( $(`.${sTarget}_chk[value='${oData[ sKey ]}']`).is(":checked") ){
                            bFlag = true;
                        }
                    }else{
                        if( self.bHiddenDataChecked ){
                            bFlag = true;
                        }
                    }
                    if( bFlag ){
                        aResult.push( oData[ sKey ] );
                    };
                });
                return aResult;
            }
        }

        let aChk = $(`#${sTarget}`).find(".fChk:checked");
        return (aChk).map(function(oChk){
            return $(this).val();
        }).toArray();
    };

    //get Selected Object
    getSelectedObject()
    {
        let self = this;
        let sKey = this.oOpt['sKey'];
        let sName = this.oOpt['sDesr'];
        let sTarget = this.oOpt['sTarget'];
        let aChk = $(`#${sTarget}`).find(".fChk:checked");
        let oResult = {};


        if( this.sViewType == 'scroll'){
            let sKey = this.oOpt['sKey'];
            if( this.isAllChecked() ){
                return (this.aData).map(function(oData){
                    oResult = {};
                    oResult[sKey] = oData[ sKey ]
                    oResult[sName] = oData[ sName ]
                    return oResult;
                });
            }else{
                let aResult = [];
                (this.aData).forEach(function(oData){
                    let bFlag = false;
                    if( $(`.${sTarget}_chk[value='${oData[ sKey ]}']`).length > 0 ){
                        if( $(`.${sTarget}_chk[value='${oData[ sKey ]}']`).is(":checked") ){
                            bFlag = true;
                        }
                    }else{
                        if( self.bHiddenDataChecked ){
                            bFlag = true;
                        };
                    }
                    if( bFlag ){
                        oResult = {};
                        oResult[sKey] = oData[ sKey ]
                        oResult[sName] = oData[ sName ]
                        aResult.push(oResult);
                    }
                });
                return aResult;
            }
        }

        if( this.sViewType == 'scroll' && this.isAllChecked() ){
            return (this.aData).map(function(oData){
                oResult = {};
                oResult[sKey] = oData[ sKey ]
                oResult[sName] = oData[ sName ]
                return oResult;
            });
        };


        return aChk.map(function(oChk){
            oResult = {};
            oResult[sKey] = $(this).val();
            oResult[sName] = $(this).attr('data-name');
            return oResult;
        }).toArray();
    };

    /*
    * 전체 Option Data Check 여부 확인 => return (true,false)
    * */
    isAllChecked()
    {
        return this.bChecked
    }

    /*
    * 최소 option 1개라도 선택 여부 확인 => return (true,false)
    * */
    isChecked()
    {
        let sTarget = this.oOpt.sTarget;
        let aChk = $(`#${sTarget}`).find(".fChk:checked");
        return aChk.length > 0 ? true : false
    }

    /*
    * SelectOption Box 닫기
    * */
    close()
    {
        $(`#${this.oOpt.sTarget}`).find(".selectedTxt").val(null)
        let oSelect = $(`#${this.oOpt.sTarget}`).find(".multiSelect");
        oSelect.fadeOut( this.fadeTime );
        if( this.oOpt.onChange ){
            let aBefore = this.preSelected;
            let aAfter  = this.getSelectedValue();
            if( JSON.stringify(aAfter) != JSON.stringify( aBefore ) ){
                this.oOpt.onChange( aAfter , this.getSelectedObject() );
            }
        };

    }

    /*
    * SelectOption Box 열기
    * */
    open()
    {
        this.preSelected = this.getSelectedValue();
        let sTarget = this.oOpt.sTarget
        let oSelect = $(`#${this.oOpt.sTarget}`).find(".multiSelect");
        let aChk = $(`#${sTarget}`).find(".fChk");
        aChk.parents('label').parents('li').show();
        oSelect.css('width' , $(`#${sTarget}`).find(".selectedTxt").css('width') );
        oSelect.css("top" , $(`#${sTarget}`).find(".selectedTxt").css('height')  );
        oSelect.fadeIn( this.fadeTime );
    }

    /*
    * 변경전, 변경후 data Get => return Object
    * */
    getChgIdx()
    {
        return {
            preIdx : this.preSelected,
            afterIdx : this.getSelectedValue()
        }
    }

    /*
    * checked by Array value
    * @param1 {Array} Value to be checked
    * */
    async setChecked(aData)
    {
        if( !aData ){
            await this.setAllChecked(false);
            return false;
        }
        let self = this;
        // Int Array cast to String Array
        aData = aData.toString().split(",");
        $(`#${this.oOpt.sTarget}`).find(".fChk").prop("checked",false);

        if( self.sViewType == 'all' ){
            aData.map(function(oData) {
                $(`#${self.oOpt.sTarget} > .multiSelect > li > label > .fChk[value=${oData}]`).prop("checked", true);
            });
        };
        if( self.sViewType == 'scroll' ){
            this.bHiddenDataChecked = false;
            self._setHideDataChecked(aData);
        }
        await this._updatePlace();

        if( this.oOpt.onChange ){
            let aBefore = this.preSelected;
            let aAfter  = this.getSelectedValue();
            if( JSON.stringify(aAfter) != JSON.stringify( aBefore ) ){
                await this.oOpt.onChange( aAfter , this.getSelectedObject() );
            }
        };
    }

    /*
    * All checked , unChecked  by boolean
    * @param1 {boolean} Value to be All checked , Unchecked
    * false -> unChecked
    * true -> checked
    * */
    async setAllChecked(bChk)
    {
        $(`#${this.oOpt.sTarget}`).find(".fChk").prop("checked",bChk);
        this.bChecked = bChk;
        this.bHiddenDataChecked = bChk;
        this._updatePlace();

        if( this.oOpt.onChange ){
            let aBefore = this.preSelected;
            let aAfter  = this.getSelectedValue();
            if( JSON.stringify(aAfter) != JSON.stringify( aBefore ) ){
                await this.oOpt.onChange( aAfter , this.getSelectedObject() );
            }
        };
    }

    /*
    * 해당 함수 실행기 select option은 삭제 되기 때문에 받드시 Submit Or 새로고침을 해주어야 함.
    * */
    setFormData()
    {
        let sTarget = this.oOpt['sTarget'];
        let bFormAll = this.oOpt['bFormAll'] || false;

        let sValue;
        if( this.isAllChecked() ){
            sValue = bFormAll ? this.getSelectedValue().join(",") : "";
        }else{
            sValue = this.getSelectedValue().join(",");
        }


        $(`#${sTarget}`).append(` <input name="multi_select_${sTarget}" type="hidden" value="${sValue}"/> `);
    }

    getData()
    {
        return this.aData;
    }
}
